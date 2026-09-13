// Authenticated Expo push-token registry. Tokens are persisted per user and
// never returned to clients. The public API only permits a self-test push;
// marketplace notifications are sent by trusted server-side order/live jobs.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';

const router = Router();

const registerSchema = z.object({
  token: z.string().min(20).max(300),
  platform: z.enum(['ios', 'android', 'web', 'unknown']).default('unknown'),
});

async function sendExpo(messages) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Expo push relay returned ${response.status}`);
  return json;
}

router.post('/register', requireAuth, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'A valid Expo push token is required.' });
    const { token, platform } = parsed.data;
    await prisma.pushToken.upsert({
      where: { token },
      create: { token, platform, userId: req.user.id },
      update: { platform, userId: req.user.id, registeredAt: new Date() },
    });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.delete('/register', requireAuth, async (req, res, next) => {
  try {
    const token = String(req.body?.token || '');
    if (!token) return res.status(400).json({ error: 'token required' });
    await prisma.pushToken.deleteMany({ where: { token, userId: req.user.id } });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

// Sends a test notification only to the authenticated user's own devices.
// No client can submit another user's Expo token.
router.post('/send', requireAuth, async (req, res, next) => {
  try {
    const title = String(req.body?.title || '').trim().slice(0, 80);
    const body = String(req.body?.body || '').trim().slice(0, 240);
    const data = req.body?.data && typeof req.body.data === 'object' ? req.body.data : {};
    if (!title) return res.status(400).json({ error: 'title required' });

    const rows = await prisma.pushToken.findMany({ where: { userId: req.user.id }, select: { token: true } });
    if (rows.length === 0) return res.status(409).json({ error: 'No push-enabled device is registered for this account.' });
    const result = await sendExpo(rows.map(({ token }) => ({ to: token, title, body, sound: 'default', data })));
    res.json({ ok: true, devices: rows.length, result });
  } catch (error) { next(error); }
});

router.get('/tokens', requireAuth, async (req, res, next) => {
  try {
    const count = await prisma.pushToken.count({ where: { userId: req.user.id } });
    res.json({ count });
  } catch (error) { next(error); }
});

export default router;
