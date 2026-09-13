// Lazy-init the OpenAI client so the server can boot without a key.
// /health and any non-AI routes still work; AI routes throw on first call.
import OpenAI from 'openai';

let _client = null;

export function getOpenAI() {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Add it to server/.env then restart the server.');
  }
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!process.env.OPENAI_API_KEY) {
  console.warn('[liva-server] OPENAI_API_KEY is not set. /api/ai/* routes will 500 until you add it to server/.env');
}
