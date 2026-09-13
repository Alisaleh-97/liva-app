import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const base = process.env.LIVA_API_URL || 'http://localhost:3001';
const stamp = Date.now();
const email = `checkout-smoke-${stamp}@example.com`;
const phone = `+97156${String(stamp).slice(-7)}`;
let userId = null;
let product = null;
let originalStock = null;

async function request(path, body, token) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

try {
  product = await prisma.product.findFirst({ where: { active: true, stock: { gte: 3 } } });
  assert.ok(product, 'seed at least one in-stock product before running checkout smoke');
  originalStock = product.stock;

  const registered = await request('/api/auth/register', {
    email,
    password: 'Checkout!Pass9',
    firstName: 'Checkout',
    lastName: 'Smoke',
    phone,
    country: 'United Arab Emirates',
    role: 'shopper',
    provider: 'email',
  });
  assert.equal(registered.status, 200);
  assert.ok(registered.json.token);
  userId = registered.json.user.id;
  const token = registered.json.token;

  const retired = await request('/api/payments/create-intent', { amount: 50 }, token);
  assert.equal(retired.status, 410, 'client-priced intent endpoint must stay disabled');

  const prepared = await request('/api/payments/prepare-order', {
    productId: product.id,
    productSeed: product.seed,
    qty: 2,
    paymentMethod: 'stripe',
    amount: 1,
  }, token);
  assert.equal(prepared.status, 200);
  assert.equal(prepared.json.amount, Math.round(product.price * 2 * 100));
  assert.notEqual(prepared.json.amount, 1, 'server must ignore a forged client amount');
  assert.ok(prepared.json.checkoutId);

  const missingAddress = await request('/api/orders', {
    checkoutId: prepared.json.checkoutId,
  }, token);
  assert.equal(missingAddress.status, 400);

  const completed = await request('/api/orders', {
    checkoutId: prepared.json.checkoutId,
    addressLine: 'Smoke Tower, Test Street, Dubai, UAE',
    deliverySlot: 'same_day',
  }, token);
  assert.equal(completed.status, 201);
  assert.equal(completed.json.order.total, product.price * 2);
  assert.equal(completed.json.order.paymentStatus, 'paid');

  const retried = await request('/api/orders', {
    checkoutId: prepared.json.checkoutId,
    addressLine: 'Smoke Tower, Test Street, Dubai, UAE',
    deliverySlot: 'same_day',
  }, token);
  assert.equal(retried.status, 200);
  assert.equal(retried.json.order.id, completed.json.order.id);
  assert.equal(retried.json.idempotent, true);

  const codPrepared = await request('/api/payments/prepare-order', {
    productSeed: product.seed,
    qty: 1,
    paymentMethod: 'cod',
  }, token);
  assert.equal(codPrepared.status, 200);
  assert.equal(codPrepared.json.paymentRequired, false);

  const codOrder = await request('/api/orders', {
    checkoutId: codPrepared.json.checkoutId,
    addressLine: 'Smoke Tower, Test Street, Dubai, UAE',
    deliverySlot: 'evening',
  }, token);
  assert.equal(codOrder.status, 201);
  assert.equal(codOrder.json.order.paymentStatus, 'cod_pending');

  const freshProduct = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(freshProduct.stock, originalStock - 3);

  console.log('checkout smoke: trusted pricing, Stripe mock, COD, stock, and idempotency passed');
} finally {
  if (userId) {
    await prisma.order.deleteMany({ where: { buyerId: userId } });
    await prisma.paymentAttempt.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  if (product && originalStock != null) {
    await prisma.product.update({ where: { id: product.id }, data: { stock: originalStock } });
  }
  await prisma.$disconnect();
}
