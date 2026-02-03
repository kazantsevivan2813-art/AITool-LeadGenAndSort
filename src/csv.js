import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';

const CSV_HEADER = [
  'organisasjonsnummer',
  'navn',
  'adresse',
  'postnummer',
  'epostadresse',
  'telefon',
  'mobil',
  'company_website',
];

/**
 * Escape a CSV field (quotes and commas).
 * @param {string} value
 * @returns {string}
 */
function escapeCsv(value) {
  if (value == null || value === '') return '';
  const s = String(value).replace(/"/g, '""');
  return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r') ? `"${s}"` : s;
}

/**
 * Ensure data dir exists and CSV file has header (for new file).
 * @param {boolean} append - If true, only ensure dir; do not write header.
 */
export async function ensureCsvFile(append) {
  const dir = path.dirname(config.paths.outputCsv);
  await fs.mkdir(dir, { recursive: true });
  if (!append) {
    const headerLine = CSV_HEADER.map(escapeCsv).join(',') + '\n';
    await fs.writeFile(config.paths.outputCsv, headerLine, 'utf-8');
  }
}

/**
 * Append one row to the CSV file.
 * @param {object} row - Keys: organisasjonsnummer, navn, adresse, postnummer, epostadresse, telefon, mobil, company_website
 */
export async function appendCsvRow(row) {
  const line =
    CSV_HEADER.map((h) => escapeCsv(row[h] ?? ''))
      .join(',') + '\n';
  await fs.appendFile(config.paths.outputCsv, line, 'utf-8');
}

export { CSV_HEADER };
