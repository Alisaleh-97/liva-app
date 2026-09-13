// Server env validation — fails fast at startup if required vars are missing
// or malformed. Import once from index.js so bad configs surface immediately
// instead of leaking into request handlers as runtime crashes.

import { z } from 'zod';

const schema = z.object({
  PORT:                z.coerce.number().int().positive().default(3001),
  NODE_ENV:            z.enum(['development', 'production', 'test']).default('development'),
  OPENAI_API_KEY:      z.string().min(20, 'OPENAI_API_KEY is required (get one from platform.openai.com)').optional(),
  STRIPE_SECRET_KEY:   z.string().startsWith('sk_').optional(),
  RESEND_API_KEY:      z.string().startsWith('re_').optional(),
  EMAIL_FROM:          z.string().email().default('hello@liva.app'),
  // Comma-separated OAuth audiences. Leave empty in local demo mode; real
  // Google/Apple tokens are rejected until these are configured.
  GOOGLE_CLIENT_IDS:   z.string().default(''),
  APPLE_CLIENT_IDS:    z.string().default(''),
  JWT_SECRET:          z.string().min(32, 'JWT_SECRET must be at least 32 chars — generate with `openssl rand -hex 32`'),
  // Comma-separated origin whitelist. In production this MUST be set to your
  // real domains; in dev we default to permissive localhost + LAN.
  CORS_ORIGINS:        z.string().default('http://localhost:8081,http://localhost:19006,http://localhost:19000'),
});

let parsed;
try {
  parsed = schema.parse(process.env);
} catch (err) {
  console.error('\n❌ Invalid server environment:\n');
  if (err.issues) {
    for (const issue of err.issues) {
      console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    console.error(err);
  }
  console.error('\nCreate/fix server/.env — see server/.env.example for the shape.\n');
  process.exit(1);
}

export const env = parsed;
export const corsOrigins = parsed.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
export const googleClientIds = parsed.GOOGLE_CLIENT_IDS.split(',').map((s) => s.trim()).filter(Boolean);
export const appleClientIds = parsed.APPLE_CLIENT_IDS.split(',').map((s) => s.trim()).filter(Boolean);
