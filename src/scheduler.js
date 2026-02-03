#!/usr/bin/env node
/**
 * Run the pipeline once (same as npm start). No 24-hour schedule.
 */
import { runPipeline } from './processor.js';

console.log('Starting pipeline...');
runPipeline()
  .then(({ lastProcessedIndex, processedCount }) => {
    console.log(`Pipeline finished. Processed ${processedCount} items (last index: ${lastProcessedIndex}).`);
  })
  .catch((e) => {
    console.error('Pipeline failed:', e);
    process.exit(1);
  });
