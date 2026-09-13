// LIVA backend — Express + OpenAI + JWT auth. Env is validated by Zod at
// import time (env.js exits the process on any invalid config), CORS is
// origin-whitelisted, and all /api routes are behind a baseline rate limit.

import 'dotenv/config';
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { env, corsOrigins } from './lib/env.js';
import chatRoute from './routes/chat.js';
import extractRoute from './routes/extract.js';
import paymentsRoute from './routes/payments.js';
import notificationsRoute from './routes/notifications.js';
import storefrontRoute from './routes/storefront.js';
import authRoute from './routes/auth.js';
import productsRoute from './routes/products.js';
import ordersRoute from './routes/orders.js';
import searchRoute from './routes/search.js';
import uploadRoute, { uploadsStatic } from './routes/upload.js';
import auctionsRoute from './routes/auctions.js';
import { initAuctionService } from './realtime/auctionService.js';
import { attachAuctionHub } from './realtime/auctionHub.js';
import { emailConfigured } from './lib/email.js';

const app = express();
app.set('trust proxy', 1); // needed so rate limiter reads real IP behind a proxy

// ── Middleware ──────────────────────────────────────────────────────────
// Strict CORS — only origins listed in CORS_ORIGINS. Requests with no origin
// (native fetch, curl) are allowed so the mobile app + local scripts still work.
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Baseline rate limit on every /api route — protects against a single
// misbehaving client without impacting the storefront static route.
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,                 // ~20 req/min avg
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Routes ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    env: env.NODE_ENV,
    openaiConfigured: !!env.OPENAI_API_KEY,
    stripeConfigured: !!env.STRIPE_SECRET_KEY,
    emailConfigured,
  });
});

app.use('/api/auth', authRoute);
app.use('/api/products', productsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/search', searchRoute);
app.use('/api/auctions', auctionsRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/ai', chatRoute);
app.use('/api/ai', extractRoute);
app.use('/api/payments', paymentsRoute);
app.use('/api/notifications', notificationsRoute);
app.use('/store', storefrontRoute);
app.use('/uploads', uploadsStatic); // serve locally-stored images

// ── Error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  // Never leak stack traces or internal messages in production
  const msg = env.NODE_ENV === 'production' ? 'Internal server error' : String(err?.message || err);
  res.status(status).json({ error: msg });
});

const server = createServer(app);
await initAuctionService();
attachAuctionHub(server);

server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[liva-server] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  console.log(`[liva-server] realtime auctions on ws://localhost:${env.PORT}/realtime`);
  console.log(`[liva-server] CORS origins: ${corsOrigins.join(', ')}`);
  console.log(`[liva-server] OpenAI: ${env.OPENAI_API_KEY ? '✓' : '—'}  Stripe: ${env.STRIPE_SECRET_KEY ? '✓' : '—'}`);
  console.log(`[liva-server] To reach this from a phone on the same Wi-Fi, set EXPO_PUBLIC_API_URL to http://<your-LAN-IP>:${env.PORT}`);
});
