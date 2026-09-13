// Orders REST — buyer creates, buyer/seller can list their own, seller can
// update status. All routes require auth.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { getStripe, stripeConfigured } from '../lib/stripe.js';
import { env } from '../lib/env.js';

const router = Router();

const createSchema = z.object({
  checkoutId:   z.string().min(8).max(200),
  addressLine:  z.string().min(5).max(300),
  deliverySlot: z.enum(['same_day', 'morning', 'evening', 'weekend']).optional(),
});

const STATUSES = ['confirmed', 'packed', 'shipped', 'ofd', 'delivered', 'cancelled'];
const inflateProduct = (product) => product && ({
  ...product,
  imageUrls: JSON.parse(product.imageUrls || '[]'),
});
const presentOrder = (order) => order && ({
  ...order,
  ...(order.product ? { product: inflateProduct(order.product) } : {}),
});

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user.id },
      orderBy: { placedAt: 'desc' },
      include: { product: true },
    });
    res.json({ orders: orders.map(presentOrder) });
  } catch (err) { next(err); }
});

router.get('/seller', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'business') return res.status(403).json({ error: 'Sellers only' });
    const orders = await prisma.order.findMany({
      where: { sellerId: req.user.id },
      orderBy: { placedAt: 'desc' },
      include: { product: true, buyer: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    res.json({ orders: orders.map(presentOrder) });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });

    const existingOrder = await prisma.order.findUnique({
      where: { paymentAttemptId: parsed.data.checkoutId },
      include: { product: true },
    });
    if (existingOrder) {
      if (existingOrder.buyerId !== req.user.id) return res.status(403).json({ error: 'Not your checkout.' });
      return res.json({ order: presentOrder(existingOrder), idempotent: true });
    }

    const attempt = await prisma.paymentAttempt.findUnique({
      where: { id: parsed.data.checkoutId },
      include: { product: true },
    });
    if (!attempt || attempt.userId !== req.user.id) return res.status(404).json({ error: 'Checkout not found.' });
    if (attempt.usedAt || attempt.status === 'completed') return res.status(409).json({ error: 'Checkout was already completed.' });
    if (attempt.expiresAt <= new Date()) {
      await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { status: 'expired' } });
      return res.status(410).json({ error: 'Checkout expired. Please try again.' });
    }
    if (!attempt.product.active) return res.status(409).json({ error: 'This product is no longer available.' });

    if (attempt.method === 'stripe') {
      if (!attempt.providerIntentId) return res.status(402).json({ error: 'Payment was not started.' });
      if (stripeConfigured) {
        const intent = await getStripe().paymentIntents.retrieve(attempt.providerIntentId);
        const meta = intent.metadata || {};
        const valid = intent.status === 'succeeded'
          && intent.amount === attempt.amountCents
          && intent.currency === attempt.currency
          && meta.purpose === 'marketplace_order'
          && meta.checkoutId === attempt.id
          && meta.userId === req.user.id
          && meta.productId === attempt.productId
          && meta.qty === String(attempt.qty);
        if (!valid) return res.status(402).json({ error: 'Payment is incomplete or does not match this order.' });
      } else {
        const validMock = env.NODE_ENV !== 'production'
          && attempt.providerIntentId === `pi_mock_order_${attempt.id}`;
        if (!validMock) return res.status(402).json({ error: 'Payment could not be verified.' });
      }
    } else if (attempt.method !== 'cod') {
      return res.status(400).json({ error: 'Unsupported payment method.' });
    }

    const order = await prisma.$transaction(async (tx) => {
      const claimed = await tx.paymentAttempt.updateMany({
        where: {
          id: attempt.id,
          userId: req.user.id,
          status: 'prepared',
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { status: 'processing' },
      });
      if (claimed.count !== 1) throw httpError(409, 'Checkout is already being completed.');

      const stock = await tx.product.updateMany({
        where: { id: attempt.productId, active: true, stock: { gte: attempt.qty } },
        data: { stock: { decrement: attempt.qty } },
      });
      if (stock.count !== 1) throw httpError(409, 'Not enough stock for this quantity.');

      const created = await tx.order.create({
        data: {
          buyerId:      req.user.id,
          sellerId:     attempt.product.sellerId,
          productId:    attempt.productId,
          qty:          attempt.qty,
          unitPrice:    attempt.amountCents / 100 / attempt.qty,
          total:        attempt.amountCents / 100,
          addressLine:  parsed.data.addressLine,
          deliverySlot: parsed.data.deliverySlot,
          paymentMethod: attempt.method,
          paymentStatus: attempt.method === 'cod' ? 'cod_pending' : 'paid',
          paymentAttemptId: attempt.id,
        },
        include: { product: true },
      });
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: 'completed', usedAt: new Date() },
      });
      return created;
    });
    res.status(201).json({ order: presentOrder(order) });
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const status = String(req.body?.status || '');
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Not found' });
    // Only the seller of this order can update its status
    if (order.sellerId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status } });
    res.json({ order: updated });
  } catch (err) { next(err); }
});

export default router;
