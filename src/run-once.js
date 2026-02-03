#!/usr/bin/env node
/**
 * Run the scraping/processing pipeline once (no schedule).
 * Use this to process the .gz file. Progress is saved so you can stop (Ctrl+C) and resume later.
 * To start from scratch, delete data/progress.json (and optionally data/companies.csv).
 */
import { runPipeline } from './processor.js';

runPipeline({
  onProgress(index, row) {
    // Optional: log every N rows
    // if (index % 50 === 0) console.log(index, row.navn);
  },
})
  .then(({ lastProcessedIndex, processedCount }) => {
    console.log(`Run complete. Processed ${processedCount} items (last index: ${lastProcessedIndex}).`);
  })
  .catch((err) => {
    console.error('Pipeline error:', err);
    process.exit(1);
  });
