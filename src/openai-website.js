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

  const sys = `You are a tool that identifies the official company website from search results.
Given a company name and a list of 5 search results (title, URL, snippet), respond with ONLY the URL that is most likely the company's official website.
If none of the results clearly look like the company's own site, respond with exactly: NONE
Do not include any explanation, only the URL or NONE.`;

  const user = `Company name: ${companyName}\n\nSearch results:\n${resultsText}`;

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
