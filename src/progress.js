import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';

/**
 * Load progress from data/progress.json.
 * @returns {{ processedIndex: number, totalCount?: number } | null}
 */
// export async function loadProgress() {
//   try {
//     const raw = await fs.readFile(config.paths.progressFile, 'utf-8');
//     const data = JSON.parse(raw);
//     return {
//       processedIndex: typeof data.processedIndex === 'number' ? data.processedIndex : -1,
//       totalCount: typeof data.totalCount === 'number' ? data.totalCount : undefined,
//     };
//   } catch (e) {
//     if (e.code === 'ENOENT') return null;
//     throw e;
//   }
// }

/**
 * Save progress so the run can be resumed later.
 * @param {number} processedIndex - Last 0-based index that was fully processed (CSV row written).
 * @param {number} [totalCount] - Total number of items (optional, for display).
 */
export async function saveProgress(processedIndex, totalCount) {
  const dir = path.dirname(config.paths.progressFile);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    config.paths.progressFile,
    JSON.stringify({ processedIndex, totalCount, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );
}

/**
 * Clear progress (e.g. when starting a full run from scratch).
 */
export async function clearProgress() {
  try {
    await fs.unlink(config.paths.progressFile);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}
