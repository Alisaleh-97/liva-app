// /api/payments — Stripe PaymentIntent + SetupIntent endpoints.
// Returns mock responses in dev without keys so the client UX still works.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getStripe, stripeConfigured } from '../lib/stripe.js';
import { requireAuth } from '../lib/auth.js';
import { env } from '../lib/env.js';
import { planAmount } from '../lib/plans.js';
import { prisma } from '../lib/db.js';

const router = Router();

const planLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment attempts. Try again shortly.' },
});

const planSchema = z.object({
  email: z.string().email(),
  plan: z.enum(['starter', 'growth', 'pro']),
  billing: z.enum(['monthly', 'yearly']),
});

const orderCheckoutSchema = z.object({
  productId: z.string().min(1).max(200).optional(),
  productSeed: z.string().min(1).max(80).optional(),
  qty: z.number().int().positive().max(50).default(1),
  paymentMethod: z.enum(['stripe', 'cod']).default('stripe'),
}).refine((value) => value.productId || value.productSeed, {
  message: 'A product is required.',
  path: ['productId'],
});

// Pre-registration plan checkout. Prices are always selected server-side;
// the client cannot choose or alter the amount charged.
router.post('/prepare-business-plan', planLimiter, async (req, res) => {
  try {
    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid business plan.' });
    const { email, plan, billing } = parsed.data;
    const amount = planAmount(plan, billing);
    if (!amount) return res.status(400).json({ error: 'Invalid business plan.' });

    if (!stripeConfigured) {
      if (env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Business payments are temporarily unavailable.' });
      }
      return res.json({
        clientSecret: `mock_plan_${Date.now()}`,
        paymentIntentId: `pi_mock_plan_${Date.now()}`,
        amount,
        currency: 'usd',
        mock: true,
      });
    }

    const stripe = getStripe();
    const customer = await stripe.customers.create({ email: email.trim().toLowerCase() });
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-09-30.acacia' },
    );
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customer.id,
      receipt_email: email.trim().toLowerCase(),
      description: `LIVA ${plan} plan (${billing})`,
      automatic_payment_methods: { enabled: true },
      metadata: {
        purpose: 'business_plan',
        email: email.trim().toLowerCase(),
        plan,
        billing,
      },
    });
    res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      amount,
      currency: intent.currency,
    });
  } catch (error) {
    console.error('[payments/prepare-business-plan]', error);
    res.status(500).json({ error: 'Unable to start secure payment.' });
  }
});

// Creates a server-owned checkout attempt. The phone sends product identity
// and quantity only; price and currency always come from the database.
router.post('/prepare-order', requireAuth, async (req, res) => {
  try {
    const parsed = orderCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid checkout.' });
    }
    const { productId, productSeed, qty, paymentMethod } = parsed.data;
    let product = productId
      ? await prisma.product.findUnique({ where: { id: productId } })
      : null;
    if ((!product || !product.active) && productSeed) {
      product = await prisma.product.findFirst({ where: { seed: productSeed, active: true } });
    }
    if (!product || !product.active) return res.status(404).json({ error: 'Product not found.' });
    if (product.stock < qty) return res.status(409).json({ error: 'Not enough stock for this quantity.' });

    const amount = Math.round(product.price * qty * 100);
    const currency = 'usd';
    if (amount < 50) return res.status(409).json({ error: 'Order total is below the payment minimum.' });
    if (paymentMethod === 'stripe' && !stripeConfigured && env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Secure card payments are temporarily unavailable.' });
    }

    const attempt = await prisma.paymentAttempt.create({
      data: {
        userId: req.user.id,
        productId: product.id,
        qty,
        amountCents: amount,
        currency,
        method: paymentMethod,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    if (paymentMethod === 'cod') {
      return res.json({
        checkoutId: attempt.id,
        amount,
        currency,
        productId: product.id,
        paymentRequired: false,
      });
    }

    if (!stripeConfigured) {
      const paymentIntentId = `pi_mock_order_${attempt.id}`;
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: { providerIntentId: paymentIntentId },
      });
      return res.json({
        checkoutId: attempt.id,
        clientSecret: `mock_${attempt.id}`,
        paymentIntentId,
        amount,
        currency,
        productId: product.id,
        paymentRequired: true,
        mock: true,
      });
    }
    const stripe = getStripe();

    let customer = req.user.stripeCustomerId;
    if (!customer) {
      const c = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || undefined,
        metadata: { livaUserId: req.user.id },
      });
      customer = c.id;
      await prisma.user.update({ where: { id: req.user.id }, data: { stripeCustomerId: customer } });
    }
    const ephemeralKey = await stripe.ephemeralKeys.create({ customer }, { apiVersion: '2024-09-30.acacia' });
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer,
      receipt_email: req.user.email,
      description: `LIVA order · ${product.name} × ${qty}`,
      automatic_payment_methods: { enabled: true },
      metadata: {
        purpose: 'marketplace_order',
        checkoutId: attempt.id,
        userId: req.user.id,
        productId: product.id,
        qty: String(qty),
        amountCents: String(amount),
      },
    });
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { providerIntentId: intent.id },
    });
    res.json({
      checkoutId: attempt.id,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      ephemeralKey: ephemeralKey.secret,
      customer,
      amount,
      currency,
      productId: product.id,
      paymentRequired: true,
    });
  } catch (e) {
    console.error('[payments/prepare-order]', e);
    res.status(500).json({ error: 'Unable to start secure checkout.' });
  }
});

// Removed because it trusted a client-provided amount. Keeping an explicit
// response helps old clients upgrade instead of silently charging it.
router.post('/create-intent', requireAuth, (_req, res) => {
  res.status(410).json({ error: 'Update LIVA to use secure checkout.' });
});

router.post('/create-setup-intent', requireAuth, async (_req, res) => {
  try {
    if (!stripeConfigured) {
      return res.json({ clientSecret: 'mock_setup_' + Date.now(), mock: true });
    }
    const stripe = getStripe();
    const intent = await stripe.setupIntents.create({ automatic_payment_methods: { enabled: true } });
    res.json({ clientSecret: intent.client_secret });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

router.post('/refund', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'business') return res.status(403).json({ error: 'Sellers only' });
    const orderId = String(req.body?.orderId || '');
    if (!orderId) return res.status(400).json({ error: 'orderId required' });
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { paymentAttempt: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.sellerId !== req.user.id) return res.status(403).json({ error: 'Not your order.' });
    if (order.paymentStatus !== 'paid') return res.status(409).json({ error: 'This order is not refundable.' });
    const paymentIntentId = order.paymentAttempt?.providerIntentId;
    if (!paymentIntentId) return res.status(409).json({ error: 'No card payment is attached to this order.' });
    if (!stripeConfigured) {
      if (env.NODE_ENV === 'production') return res.status(503).json({ error: 'Refunds are temporarily unavailable.' });
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'refunded', status: 'cancelled' } }),
        prisma.paymentAttempt.update({ where: { id: order.paymentAttempt.id }, data: { status: 'refunded' } }),
      ]);
      return res.json({ ok: true, mock: true });
    }
    const refund = await getStripe().refunds.create({ payment_intent: paymentIntentId });
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'refunded', status: 'cancelled' } }),
      prisma.paymentAttempt.update({ where: { id: order.paymentAttempt.id }, data: { status: 'refunded' } }),
    ]);
    res.json({ ok: true, id: refund.id });
  } catch (e) {
    console.error('[payments/refund]', e);
    res.status(500).json({ error: 'Unable to refund this order.' });
  }
});

export default router;
