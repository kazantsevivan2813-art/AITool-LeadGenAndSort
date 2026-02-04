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

  const sys = `You are given search results for a Norwegian company.
Each result has a Title, URL and Snippet.

Your task: pick EXACTLY ONE URL, or reply with NONE.

Algorithm:
1) Look for the company's own website:
   - If url contains company name, the main domain (e.g. www.companyname.no) must contain the company name or a clear abbreviation of it.
     Example: company "BLIKKENSLAGER RUNE EDVARDSEN" → domain should be like runeedvardsen.no, not blikkenslag.no.
   - A page like www.blikkenslag.no/blikkenslagere/... is NOT the company's site: the domain is blikkenslag.no (a directory), so reject it.
   - Also reject any directory/listing domain: proff.no, 1881.no, tracxn.com, brreg.no, blikkenslag.no, saffa.no, yra.no, gulesider.no, oljelandet.no,vibbo.no, inpartiet.no,jubilee.no, expertvask.no, www.bestilletransport.no, no.wikipedia.org, regnskapsklinikken.no and similar sites that list many businesses.
   - Title or Snippet should clearly match the company name.
   - If several match, choose the one that appears earliest in the list.

2) If you cannot find a clear company website, look for the company's Facebook page:
   - A facebook.com or fb.com URL.
   - Title or Snippet clearly contains the company name.
   - If several match, choose the one that appears earliest in the list.

3) If no result matches step 1 or step 2, reply with exactly: NONE.

Output format: ONLY the chosen URL (no explanation), or the word NONE.`;

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