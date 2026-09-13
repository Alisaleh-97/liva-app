import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const base = process.env.LIVA_API_URL || 'http://localhost:3001';
const stamp = Date.now();
const email = `auth-smoke-${stamp}@example.com`;
const phone = `+97155${String(stamp).slice(-7)}`;

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
  const prepared = await request('/api/payments/prepare-business-plan', {
    email,
    plan: 'growth',
    billing: 'monthly',
  });
  assert.equal(prepared.status, 200);
  assert.ok(prepared.json.paymentIntentId);

  const registered = await request('/api/auth/register', {
    email,
    password: 'Strong!Pass9',
    firstName: 'Auth',
    lastName: 'Smoke',
    phone,
    country: 'United Arab Emirates',
    role: 'business',
    provider: 'email',
    businessName: 'Smoke Market',
    businessCategory: 'Electronics',
    businessAddress: 'Dubai',
    plan: 'growth',
    billing: 'monthly',
    planPaymentId: prepared.json.paymentIntentId,
  });
  assert.equal(registered.status, 200);
  assert.equal(registered.json.user.businessName, 'Smoke Market');
  assert.equal(registered.json.user.plan, 'growth');
  assert.ok(registered.json.token);

  const duplicateEmail = await request('/api/auth/register', {
    email,
    password: 'Strong!Pass9',
    firstName: 'Duplicate',
    lastName: 'Email',
    phone: `${phone}1`,
    country: 'United Arab Emirates',
  });
  assert.equal(duplicateEmail.status, 409);

  const duplicatePhone = await request('/api/auth/register', {
    email: `other-${email}`,
    password: 'Strong!Pass9',
    firstName: 'Duplicate',
    lastName: 'Phone',
    phone,
    country: 'United Arab Emirates',
  });
  assert.equal(duplicatePhone.status, 409);

  const resetRequested = await request('/api/auth/password-reset/request', { email });
  assert.equal(resetRequested.status, 202);
  assert.match(resetRequested.json.devCode || '', /^\d{6}$/);

  const reset = await request('/api/auth/password-reset/confirm', {
    email,
    code: resetRequested.json.devCode,
    newPassword: 'Changed!Pass8',
  });
  assert.equal(reset.status, 200);

  const loggedIn = await request('/api/auth/login', { email, password: 'Changed!Pass8' });
  assert.equal(loggedIn.status, 200);
  assert.ok(loggedIn.json.token);

  const meResponse = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loggedIn.json.token}` },
  });
  const me = await meResponse.json();
  assert.equal(meResponse.status, 200);
  assert.equal(me.user.email, email);
  assert.equal(me.user.role, 'business');

  const demo = await request('/api/auth/demo', { provider: 'google', role: 'shopper' });
  assert.equal(demo.status, 200);
  assert.ok(demo.json.token);
  assert.equal(demo.json.user.provider, 'google');

  const unconfiguredOAuth = await request('/api/auth/oauth/start', {
    provider: 'google',
    credential: 'not-a-real-google-token-but-long-enough',
  });
  assert.equal(unconfiguredOAuth.status, 503);

  console.log('auth smoke: register, uniqueness, reset, login, /me, and server-backed demo OAuth passed');
} finally {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
}
