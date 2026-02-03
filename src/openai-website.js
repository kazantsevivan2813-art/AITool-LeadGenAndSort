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

  const sys = `You are a tool that picks ONE URL for a Norwegian company from search results. Use this priority:

1) First: The company's own official website (the company owns the domain; e.g. companyname.no).
2) Second: The company's Facebook page (facebook.com/... or fb.com/... for this company).
3) Third (only if there is no clear official website and no Facebook): A business directory / listing page for this company. Use this order of preference for the third option:
   - tracxn.com 
   - proff.no 
   - 1881.no / www.1881.no 
   - Other similar directory or "company info" pages that show this specific company.

Do NOT choose brreg.no (general company register). Do NOT choose a random directory page that is not about this company.

If none of the results match any of the above, respond with exactly: NONE

Given the company name and the list of search results (title, URL, snippet), respond with ONLY one URL or NONE. No explanation.`;

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
    if (!content || content.toUpperCase() === 'NONE') return '';
    // Normalize: if it looks like a URL, return it
    if (/^https?:\/\//i.test(content)) return content;
    if (/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/.test(content)) return `https://${content.replace(/^https?:\/\//i, '')}`;
    return content;
  } catch (e) {
    console.error('OpenAI identifyCompanyWebsite error:', e.message);
    return '';
  }
}