#!/usr/bin/env node
/**
 * Main entry: runs the pipeline once (same as npm run run-once).
 * For 24h scheduled runs, use: npm run schedule
 */
import { runPipeline } from './processor.js';

runPipeline()
  .then(({ lastProcessedIndex, processedCount }) => {
    console.log(`Run complete. Processed ${processedCount} items (last index: ${lastProcessedIndex}).`);
  })
  .catch((err) => {
    console.error('Pipeline error:', err);
    process.exit(1);
  });
