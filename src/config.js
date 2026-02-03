import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Load .env from project root so URL/keys are found regardless of cwd
dotenv.config({ path: path.join(projectRoot, '.env') });

export const config = {
  /** URL of the .gz file to download */
  dataGzUrl: process.env.DATA_GZ_URL || '',
  serperApiKey: process.env.SERPER_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  /** Delay in ms between Serper/OpenAI requests */
  requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS || '500', 10),

  paths: {
    projectRoot,
    /** Directory for data files */
    downloadDir: path.join(projectRoot, 'data'),
    /** Downloaded .gz file saved here */
    downloadedGz: path.join(projectRoot, 'data', 'source.json.gz'),
    /** Output CSV path */
    outputCsv: path.join(projectRoot, 'data', 'companies.csv'),
    /** Progress file: { processedIndex, totalCount (optional) } */
    progressFile: path.join(projectRoot, 'data', 'progress.json'),
  },
};
