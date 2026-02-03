import OpenAI from 'openai';
import { config } from './config.js';

const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

/**
 * Given company name and 5 search results, ask OpenAI which link is most likely the company's official website.
 * @param {string} companyName
 * @param {Array<{ title: string, link: string, snippet: string }>} results
 * @returns {Promise<string>} - URL or empty string if none identified
 */
export async function identifyCompanyWebsite(companyName, results) {
  if (!openai || !results.length) return '';

  const resultsText = results
    .map((r, i) => `${i + 1}. Title: ${r.title}\n   URL: ${r.link}\n   Snippet: ${r.snippet}`)
    .join('\n\n');

  const sys = `You identify the company website or Facebook page for a Norwegian company from search results. Reply with ONLY one URL, or NONE.

Return a URL only if it is one of these two (and only these two):
1) The company's own official website — the company owns the domain (e.g. companyname.no, companyname.com). Not a directory, not a listing site, not brreg.no.
2) The company's Facebook page — a facebook.com or fb.com page that is this company's official page.

Do not return directory sites, listing sites, proff.no, 1881.no, tracxn.com, brreg.no, or any other third-party page. Only the company's own website or their Facebook page.
If there is no clear company website and no clear Facebook page in the results, reply with exactly: NONE`;

  const user = `Country: Norway\nCompany name: ${companyName}\n\nSearch results:\n${resultsText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      max_tokens: 200,
      temperature: 0,
    });
    const content = (completion.choices[0]?.message?.content || '').trim();
    let url = '';
    if (content && content.toUpperCase() !== 'NONE') {
      if (/^https?:\/\//i.test(content)) url = content;
      else if (/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/.test(content)) url = `https://${content.replace(/^https?:\/\//i, '')}`;
      else url = content;
    }
    return url;
  } catch (e) {
    console.error('OpenAI identifyCompanyWebsite error:', e.message);
    return '';
  }
}