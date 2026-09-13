// /api/ai/chat — commerce intelligence assistant.
// Takes a chat history, asks OpenAI to respond in the LIVA-assistant voice,
// and returns text + (optionally) referenced product IDs and quick-reply chips.

import { Router } from 'express';
import { getOpenAI, MODEL } from '../lib/openai.js';
import { PRODUCTS, catalogSummary } from '../catalog.js';

const router = Router();

const PRODUCT_IDS = PRODUCTS.map((p) => p.id);

const SYSTEM_PROMPT = `You are LIVA's commerce intelligence assistant — a sharp, friendly
decision engine for a livestream-shopping creator named Ava. You answer
questions about what to buy, what to sell, when to go live, market trends, and
pricing. Be concise (1–3 sentences). Use real numbers when reasonable.

You have access to LIVA's catalog (IDs and names):
${catalogSummary()}

You MUST respond with a single JSON object matching exactly this shape:
{
  "text": "<your reply, plain prose, no markdown>",
  "productIds": ["pX", "pY"],  // 0 to 3 ids drawn ONLY from the catalog above; omit or [] if not recommending products
  "chips": ["Schedule live", "Go live now"]  // 0 to 4 short quick-reply suggestions; omit or [] if none
}
Do not include any text outside the JSON. Never invent product IDs.`;

router.post('/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-12).map((m) => ({
          role: m.role === 'ai' ? 'assistant' : m.role,
          content: String(m.content || ''),
        })),
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { text: raw, productIds: [], chips: [] };
    }

    // sanity-filter productIds to known catalog
    const safeIds = Array.isArray(parsed.productIds)
      ? parsed.productIds.filter((id) => PRODUCT_IDS.includes(id)).slice(0, 3)
      : [];
    const safeChips = Array.isArray(parsed.chips) ? parsed.chips.slice(0, 4).map(String) : [];

    res.json({
      text: String(parsed.text || '').trim() || 'On it.',
      productIds: safeIds,
      chips: safeChips,
    });
  } catch (e) {
    console.error('[ai/chat]', e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

export default router;
