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

  const sys = `You are a tool that identifies the best URL for a Norwegian company from search results.
All companies are located in Norway. Prefer Norwegian websites (e.g. .no domains) when they clearly belong to the company.
Priority:
1) First choose the company's own official website (owned by the company, not a directory or aggregator).
2) If there is no clear official website, choose the company's Facebook page URL.
Always exclude domains like proff.no and 1881.no. These are business directories, not the company's own site.
Given a company name and a list of 5 search results (title, URL, snippet), respond with ONLY the single URL that best matches the above priority.
If none of the results clearly match any of the above, respond with exactly: NONE
Do not include any explanation, only the URL or NONE.`;

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