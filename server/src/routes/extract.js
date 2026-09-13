// /api/ai/extract — product extraction from a URL.
// Fetches the page, strips boilerplate, feeds the HTML excerpt to OpenAI,
// returns a structured product record (name/brand/price/description/imageUrl).

import { Router } from 'express';
import { getOpenAI, MODEL } from '../lib/openai.js';

const router = Router();

const SYSTEM = `You are a product-extraction parser. Given a slice of a product
page's HTML, extract the product's core attributes. Respond as a single JSON
object exactly matching:
{
  "name": "<short product name>",
  "brand": "<brand if visible, else empty string>",
  "price": <numeric USD price, no currency symbol, or null if unknown>,
  "description": "<one-sentence summary>",
  "imageUrl": "<absolute https URL to a primary image, or empty string>"
}
If the input is clearly not a product page, return { "name": "", "brand": "", "price": null, "description": "", "imageUrl": "" }.
No text outside the JSON.`;

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (LIVA-extract/0.1; +https://liva.app) Chrome/120.0',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) throw new Error(`Fetch ${res.status}`);
  if (!/html/i.test(ct)) throw new Error('Not an HTML page');
  return res.text();
}

// Strip scripts/styles/comments and collapse whitespace so the slice we send
// to OpenAI is meaningful product markup, not minified bundles.
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

router.post('/extract', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'invalid url' });
    }
    if (!/^https?:$/.test(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'only http/https urls supported' });
    }

    let html;
    try {
      html = await fetchPage(url);
    } catch (e) {
      return res.status(400).json({ error: 'could not load that page', detail: String(e?.message || e) });
    }
    const slice = stripHtml(html).slice(0, 12000);

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Source URL: ${url}\n\nHTML excerpt:\n${slice}` },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    // light validation
    const out = {
      name: typeof parsed.name === 'string' ? parsed.name.trim() : '',
      brand: typeof parsed.brand === 'string' ? parsed.brand.trim() : '',
      price: typeof parsed.price === 'number' ? parsed.price : null,
      description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
      imageUrl: typeof parsed.imageUrl === 'string' ? parsed.imageUrl.trim() : '',
    };

    if (!out.name) {
      return res.json({ ...out, error: 'no product detected' });
    }
    res.json(out);
  } catch (e) {
    console.error('[ai/extract]', e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

export default router;
