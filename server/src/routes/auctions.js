import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { createAuction, getAuction, listAuctions, placeBid } from '../realtime/auctionService.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ serverTime: Date.now(), auctions: listAuctions() });
});

router.get('/:id', (req, res) => {
  const auction = getAuction(req.params.id, true);
  if (!auction) return res.status(404).json({ error: 'Auction not found.' });
  res.json({ serverTime: Date.now(), auction });
});

const bidSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000),
  requestId: z.string().min(8).max(100).optional(),
});

router.post('/:id/bids', requireAuth, async (req, res, next) => {
  try {
    const parsed = bidSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid bid amount.' });
    const auction = await placeBid({
      auctionId: req.params.id,
      user: req.user,
      amount: parsed.data.amount,
      requestId: parsed.data.requestId,
    });
    res.status(201).json({ serverTime: Date.now(), auction });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message, code: error.code, minimum: error.minimum });
    }
    next(error);
  }
});

const createSchema = z.object({
  productId: z.string().min(1).max(100),
  startingBid: z.coerce.number().positive().max(1_000_000),
  minIncrement: z.coerce.number().positive().max(100_000),
  durationMinutes: z.coerce.number().int().min(1).max(24 * 60),
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'business') return res.status(403).json({ error: 'A business account is required.' });
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid auction.' });
    const auction = await createAuction({ user: req.user, ...parsed.data });
    res.status(201).json({ auction });
  } catch (error) { next(error); }
});

export default router;
