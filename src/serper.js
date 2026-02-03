import { config } from './config.js';

/**
 * Search using Serper API; return first 5 organic results (title, link, snippet).
 * @param {string} query - Search query (e.g. company name).
 * @returns {Promise<Array<{ title: string, link: string, snippet: string }>>}
 */
export async function searchCompany(query) {
  if (!config.serperApiKey) {
    console.warn('SERPER_API_KEY not set; skipping website lookup');
    return [];
  }
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': config.serperApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: 5,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Serper API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const organic = data.organic || [];
  return organic.slice(0, 5).map((o) => ({
    title: o.title || '',
    link: o.link || '',
    snippet: o.snippet || '',
  }));
}
