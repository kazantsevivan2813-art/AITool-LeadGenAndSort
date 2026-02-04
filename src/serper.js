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
  let json = {}
  if (query.endsWith(' AS')) {
    query = query + ' a';
    json.q = query;
    json.gl = "no";
  } else {
    json.q = query;
  }
  json.num = 7;
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': config.serperApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(json),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Serper API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const organic = data.organic || [];
  return organic.slice(0, 7).map((o) => ({
    title: o.title || '',
    link: o.link || '',
    snippet: o.snippet || '',
  }));
}

/**
 * Search Google Maps / Business profile via Serper API.
 * Returns the first maps result (title, link, website if available).
 * This is used as a fallback when no clear website/Facebook URL is found.
 * @param {string} query - e.g. `${companyName} ${location}`
 * @returns {Promise<{ title: string, link: string, website: string } | null>}
 */
export async function searchCompanyGooglePage(query) {
  if (!config.serperApiKey) {
    console.warn('SERPER_API_KEY not set; skipping maps lookup');
    return null;
  }
  const res = await fetch('https://google.serper.dev/maps', {
    method: 'POST',
    headers: {
      'X-API-KEY': config.serperApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      limit: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Serper Maps API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const places = data.places || data.placesResults || [];
  if (!places.length) return null;

  const p = places[0] || {};
  const placeId = p.placeId || '';
  const address = p.address || '';
  if (!placeId || !address.includes('Norway')) return null;

  if (query.toLowerCase().includes(p.title.toLowerCase()) || p.title.toLowerCase().includes(query.toLowerCase())) {
    return "https://www.google.com/maps/place/?q=place_id:" + p.placeId || '';
  }
}

