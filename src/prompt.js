import { createInterface } from 'readline';

/**
 * Ask user "Will you update database?" (yes/no). Returns 'yes' or 'no'.
 * Re-prompts until input is 'yes' or 'no' (case-insensitive).
 */
export function promptUpdateDatabase() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const ask = () => {
      rl.question('Will you update database? (yes/no): ', (answer) => {
        const normalized = (answer || '').trim().toLowerCase();
        if (normalized === 'yes' || normalized === 'no') {
          rl.close();
          resolve(normalized);
        } else {
          console.log('Please enter "yes" or "no".');
          ask();
        }
      });
    };
    ask();
  });
}
