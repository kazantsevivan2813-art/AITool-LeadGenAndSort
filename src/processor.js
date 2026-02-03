import { createReadStream } from 'fs';
import { mkdir } from 'fs/promises';
import { access } from 'fs/promises';
import { spawn } from 'child_process';
import { createGunzip } from 'zlib';
import StreamArray from 'stream-json/streamers/StreamArray.js';
import { config } from './config.js';
import { loadProgress, saveProgress, clearProgress } from './progress.js';
import { ensureCsvFile, appendCsvRow } from './csv.js';
import { promptUpdateDatabase } from './prompt.js';
import { extractRow } from './extract.js';
import { searchCompany } from './serper.js';
import { identifyCompanyWebsite } from './openai-website.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Process one company: extract row, get website via Serper + OpenAI, append to CSV.
 * @param {object} obj - One enhet JSON object
 * @param {number} index - 0-based index in the array
 * @returns {Promise<object>} - Row written to CSV (with company_website)
 */
async function processOne(obj, index) {
  const row = extractRow(obj);
  let company_website = '';

  if (row.navn && (config.serperApiKey && config.openaiApiKey)) {
    try {
      await delay(config.requestDelayMs);
      const results = await searchCompany(row.navn);
      if (results.length) {
        await delay(config.requestDelayMs);
        company_website = await identifyCompanyWebsite(row.navn, results);
      }
    } catch (e) {
      console.error(`[${index}] Serper/OpenAI error for "${row.navn}":`, e.message);
    }
  }

  const csvRow = { ...row, company_website };
  await appendCsvRow(csvRow);
  return csvRow;
}

/**
 * Step 1: Download .gz file from URL to project directory (curl). Waits until download is complete.
 * @returns {Promise<string>} Path to the downloaded .gz file
 */
async function downloadGzFile() {
  const url = config.dataGzUrl.trim();
  if (!url) {
    throw new Error('DATA_GZ_URL is empty. Check your .env file and that it is in the project root.');
  }
  const gzPath = config.paths.downloadedGz;
  await mkdir(config.paths.downloadDir, { recursive: true });

  console.log('--- Step 1: Download .gz file ---');
  console.log('URL:', url);
  console.log('Saving to:', gzPath);

  await new Promise((resolve, reject) => {
    const curl = spawn('curl', ['-L', '-o', gzPath, url], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    curl.on('error', (err) => reject(new Error(`curl failed to start: ${err.message}`)));
    curl.on('close', (code, signal) => {
      if (code !== 0) {
        reject(new Error(`curl exited with code ${code}${signal ? ` (signal ${signal})` : ''}`));
      } else {
        resolve();
      }
    });
  });

  console.log('Download done. Saved to', gzPath);
  return gzPath;
}

/**
 * Check if the downloaded .gz file exists in the data folder.
 */
async function downloadedGzExists() {
  try {
    await access(config.paths.downloadedGz);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}

/**
 * Run the full pipeline: optionally download .gz (or use existing), then process data.
 * When .gz already exists in data folder, prompts "Will you update database?" (yes/no).
 * - yes: re-download, set processed number to 0, start from 0.
 * - no: skip download, resume from saved progress.
 * When data folder / .gz does not exist, starts from download without prompting.
 * @param {{ onProgress?: (processed: number, row: object) => void }} opts
 */
export async function runPipeline(opts = {}) {
  const { onProgress } = opts;
  if (!config.dataGzUrl) {
    throw new Error('DATA_GZ_URL is not set in .env');
  }

  const gzExists = await downloadedGzExists();
  let gzPath;
  let resumeFrom = 0;
  let appendCsv = false;

  if (gzExists) {
    const answer = await promptUpdateDatabase();
    if (answer === 'yes') {
      await clearProgress();
      await ensureCsvFile(false);
      gzPath = await downloadGzFile();
      resumeFrom = 0;
      appendCsv = false;
    } else {
      console.log('Skipping download. Using existing file.');
      gzPath = config.paths.downloadedGz;
      const progress = await loadProgress();
      resumeFrom = progress ? progress.processedIndex + 1 : 0;
      // appendCsv = true means "append if file exists", but ensureCsvFile will check and write header if file doesn't exist
      appendCsv = resumeFrom > 0;
      await ensureCsvFile(appendCsv);
      if (resumeFrom > 0) {
        console.log(`Resuming from index ${resumeFrom} (${progress.processedIndex + 1} already processed).`);
      }
    }
  } else {
    await mkdir(config.paths.downloadDir, { recursive: true });
    gzPath = await downloadGzFile();
    resumeFrom = 0;
    appendCsv = false;
    await ensureCsvFile(false);
  }

  const progress = await loadProgress();
  let lastProcessedIndex = progress ? progress.processedIndex : -1;

  // Step 2: Process data (decompress, parse JSON array, extract to CSV, Serper/OpenAI)
  console.log('--- Step 2: Process data ---');
  console.log('Decompressing and parsing JSON array from', gzPath);
  const fileRead = createReadStream(gzPath);
  const gunzip = createGunzip();
  const arrayStream = fileRead.pipe(gunzip).pipe(StreamArray.withParser());
  console.log('Stream connected. Processing companies...');

  let processedCount = 0;

  await new Promise((resolve, reject) => {
    arrayStream.on('data', async ({ key, value }) => {
      const index = key;
      arrayStream.pause();

      try {
        if (index < resumeFrom) {
          arrayStream.resume();
          return;
        }

        const row = await processOne(value, index);
        lastProcessedIndex = index;
        processedCount++;
        await saveProgress(index);

        console.log(
          `[${index}] Processed: ${row.navn || '(no name)'} | org.nr: ${row.organisasjonsnummer} | website: ${row.company_website || '-'}`
        );
        if (onProgress) onProgress(index, row);
      } catch (e) {
        arrayStream.destroy(e);
        reject(e);
        return;
      }

      arrayStream.resume();
    });

    arrayStream.on('end', async () => {
      console.log('Stream finished. Saving progress...');
      await saveProgress(lastProcessedIndex, lastProcessedIndex + 1);
      resolve();
    });
    arrayStream.on('error', reject);
  });

  console.log(`Done. Last processed index: ${lastProcessedIndex}. Total new rows: ${processedCount}.`);
  return { lastProcessedIndex, processedCount };
}
