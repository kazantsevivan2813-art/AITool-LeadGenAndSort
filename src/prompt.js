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

/**
 * Prompt for postnummer range (forretningsadresse.postnummer).
 * User can press Enter to skip (no filtering).
 * Returns { from: number|null, to: number|null }.
 */
export function promptPostnummerRange() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const askNumber = (question) =>
    new Promise((resolve) => {
      rl.question(question, (answer) => {
        const trimmed = (answer || '').trim();
        if (!trimmed) {
          resolve(null);
          return;
        }
        const n = Number(trimmed);
        if (Number.isNaN(n)) {
          console.log('Please enter a numeric value or press Enter to skip.');
          resolve(askNumber(question));
        } else {
          resolve(n);
        }
      });
    });

  return (async () => {
    console.log('You can filter companies by postnummer range (forretningsadresse.postnummer).');
    const from = await askNumber('Postnummer FROM (blank = any): ');
    const to = await askNumber('Postnummer TO   (blank = any): ');
    rl.close();

    if (from == null && to == null) {
      console.log('No postnummer range specified. Processing all companies.');
      return { from: null, to: null };
    }

    // Normalize range so from <= to when both are set
    if (from != null && to != null && from > to) {
      return { from: to, to: from };
    }

    console.log(
      `Filtering companies with forretningsadresse.postnummer between ` +
        `${from != null ? from : '-∞'} and ${to != null ? to : '+∞'}.`,
    );
    return { from, to };
  })();
}

