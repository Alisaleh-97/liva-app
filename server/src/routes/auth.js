// Auth routes — register, login, current-user endpoint. Rate-limited to slow
// down credential stuffing / brute force. Passwords never travel back to the
// client; only a JWT does.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { hashPassword, verifyPassword, signToken, requireAuth } from '../lib/auth.js';
import { findByEmail, findByPhone, createUser, publicUser } from '../lib/userStore.js';
import { prisma } from '../lib/db.js';
import { env, googleClientIds, appleClientIds } from '../lib/env.js';
import { sendPasswordResetCode } from '../lib/email.js';
import { verifyBusinessPlanPayment } from '../lib/stripe.js';

const router = Router();

// Tight limiter on write endpoints — 10 attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});

const strongPassword = z.string().min(8)
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/[0-9]/, 'Must include a number')
  .regex(/[^A-Za-z0-9]/, 'Must include a special character');

const registerSchema = z.object({
  email:     z.string().email(),
  password:  strongPassword,
  firstName: z.string().min(1).max(50),
  lastName:  z.string().min(1).max(50),
  phone:     z.string().min(7).max(20),
  country:   z.string().min(2).max(80),
  dob:       z.string().max(20).optional(),
  role:      z.enum(['shopper', 'business']).default('shopper'),
  // Google/Apple identities are created only by verified OAuth endpoints.
  provider:  z.literal('email').default('email'),
  businessName: z.string().min(2).max(120).optional(),
  businessCategory: z.string().min(2).max(80).optional(),
  businessAddress: z.string().min(4).max(300).optional(),
  taxId: z.string().max(80).optional(),
  plan: z.enum(['starter', 'growth', 'pro']).optional(),
  billing: z.enum(['monthly', 'yearly']).optional(),
  planPaymentId: z.string().min(8).max(200).optional(),
}).superRefine((value, ctx) => {
  if (value.role !== 'business') return;
  for (const field of ['businessName', 'businessCategory', 'businessAddress', 'plan', 'billing', 'planPaymentId']) {
    if (!value[field]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required for business accounts` });
    }
  }
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const resetRequestSchema = z.object({ email: z.string().email() });
const resetConfirmSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  newPassword: strongPassword,
});

const oauthStartSchema = z.object({
  provider: z.enum(['google', 'apple']),
  credential: z.string().min(20).max(10_000),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
});

const oauthCompleteSchema = z.object({
  registrationToken: z.string().min(20),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().min(7).max(20),
  country: z.string().min(2).max(80),
  dob: z.string().max(20).optional(),
  role: z.enum(['shopper', 'business']).default('shopper'),
  businessName: z.string().min(2).max(120).optional(),
  businessCategory: z.string().min(2).max(80).optional(),
  businessAddress: z.string().min(4).max(300).optional(),
  taxId: z.string().max(80).optional(),
  plan: z.enum(['starter', 'growth', 'pro']).optional(),
  billing: z.enum(['monthly', 'yearly']).optional(),
  planPaymentId: z.string().min(8).max(200).optional(),
}).superRefine((value, ctx) => {
  if (value.role !== 'business') return;
  for (const field of ['businessName', 'businessCategory', 'businessAddress', 'plan', 'billing', 'planPaymentId']) {
    if (!value[field]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required for business accounts` });
  }
});

const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

function oauthError(status, message) {
  return Object.assign(new Error(message), { status });
}

async function verifyGoogleCredential(accessToken) {
  if (googleClientIds.length === 0) throw oauthError(503, 'Google sign-in is not configured on this server.');
  const tokenResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`, {
    signal: AbortSignal.timeout(8_000),
  });
  if (!tokenResponse.ok) throw oauthError(401, 'Google session is invalid or expired.');
  const tokenInfo = await tokenResponse.json();
  if (!googleClientIds.includes(String(tokenInfo.aud || ''))) throw oauthError(401, 'Google token was issued for a different app.');
  if (!(tokenInfo.email_verified === true || tokenInfo.email_verified === 'true')) throw oauthError(401, 'Google email is not verified.');

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(8_000),
  });
  if (!profileResponse.ok) throw oauthError(401, 'Unable to read the verified Google profile.');
  const profile = await profileResponse.json();
  return {
    provider: 'google',
    subject: String(profile.sub || tokenInfo.sub || ''),
    email: String(profile.email || tokenInfo.email || '').trim().toLowerCase(),
    firstName: String(profile.given_name || '').trim(),
    lastName: String(profile.family_name || '').trim(),
  };
}

async function verifyAppleCredential(identityToken, suppliedName = {}) {
  if (appleClientIds.length === 0) throw oauthError(503, 'Apple sign-in is not configured on this server.');
  let payload;
  try {
    ({ payload } = await jwtVerify(identityToken, appleKeys, {
      issuer: 'https://appleid.apple.com',
      audience: appleClientIds,
    }));
  } catch {
    throw oauthError(401, 'Apple session is invalid or expired.');
  }
  return {
    provider: 'apple',
    subject: String(payload.sub || ''),
    email: String(payload.email || '').trim().toLowerCase(),
    firstName: String(suppliedName.firstName || '').trim(),
    lastName: String(suppliedName.lastName || '').trim(),
  };
}

async function verifyOAuthCredential(input) {
  const identity = input.provider === 'google'
    ? await verifyGoogleCredential(input.credential)
    : await verifyAppleCredential(input.credential, input);
  if (!identity.subject) throw oauthError(401, 'Identity provider did not return an account id.');
  return identity;
}

function resetDigest(userId, code) {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(`${userId}:${code}`).digest('hex');
}

router.post('/oauth/start', authLimiter, async (req, res) => {
  try {
    const parsed = oauthStartSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid OAuth request.' });
    const identity = await verifyOAuthCredential(parsed.data);

    const existing = await prisma.user.findUnique({ where: { providerSubject: identity.subject } });
    if (existing) {
      if (existing.provider !== identity.provider) return res.status(409).json({ error: 'This identity is linked to another provider.' });
      return res.json({ token: signToken(existing.id), user: publicUser(existing), requiresRegistration: false });
    }
    if (!identity.email) {
      return res.status(422).json({ error: 'Your identity provider did not share an email. Re-enable email sharing and try again.' });
    }
    if (await findByEmail(identity.email)) {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in with its original method before linking another provider.' });
    }

    const registrationToken = jwt.sign({
      purpose: 'oauth_registration',
      provider: identity.provider,
      providerSubject: identity.subject,
      email: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName,
    }, env.JWT_SECRET, { expiresIn: '15m' });
    res.json({
      requiresRegistration: true,
      registrationToken,
      profile: {
        provider: identity.provider,
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
      },
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status >= 500) console.error('[auth/oauth/start]', error);
    res.status(status).json({ error: status >= 500 ? 'Unable to verify this sign-in right now.' : error.message });
  }
});

router.post('/oauth/complete', authLimiter, async (req, res, next) => {
  try {
    const parsed = oauthCompleteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile.' });
    let proof;
    try {
      proof = jwt.verify(parsed.data.registrationToken, env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Registration session expired. Sign in with your provider again.' });
    }
    if (proof?.purpose !== 'oauth_registration'
      || !['google', 'apple'].includes(proof.provider)
      || !proof.providerSubject
      || !proof.email) {
      return res.status(401).json({ error: 'Invalid registration session.' });
    }

    if (await prisma.user.findUnique({ where: { providerSubject: String(proof.providerSubject) } })) {
      return res.status(409).json({ error: 'This provider account is already registered. Sign in instead.' });
    }
    if (await findByEmail(String(proof.email))) return res.status(409).json({ error: 'An account with this email already exists.' });
    if (await findByPhone(parsed.data.phone)) return res.status(409).json({ error: 'This phone number is already linked to another account.' });

    let planPayment = null;
    if (parsed.data.role === 'business') {
      planPayment = await verifyBusinessPlanPayment({
        paymentIntentId: parsed.data.planPaymentId,
        email: String(proof.email),
        plan: parsed.data.plan,
        billing: parsed.data.billing,
      });
      if (!planPayment.ok) return res.status(402).json({ error: planPayment.reason || 'Plan payment is required.' });
    }

    const firstName = parsed.data.firstName.trim();
    const lastName = parsed.data.lastName.trim();
    const user = await createUser({
      email: String(proof.email),
      passwordHash: await hashPassword(crypto.randomBytes(48).toString('base64url')),
      firstName,
      lastName,
      phone: parsed.data.phone,
      country: parsed.data.country,
      dob: parsed.data.dob,
      role: parsed.data.role,
      provider: String(proof.provider),
      providerSubject: String(proof.providerSubject),
      businessName: parsed.data.businessName?.trim(),
      businessCategory: parsed.data.businessCategory,
      businessAddress: parsed.data.businessAddress?.trim(),
      taxId: parsed.data.taxId?.trim(),
      plan: parsed.data.plan,
      billing: parsed.data.billing,
      planRenewsAt: parsed.data.plan
        ? new Date(Date.now() + (parsed.data.billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        : null,
      planPaymentId: parsed.data.planPaymentId,
      stripeCustomerId: planPayment?.customerId || null,
      subscriptionStatus: parsed.data.role === 'business' ? 'active' : null,
    });
    res.json({ token: signToken(user.id), user: publicUser(user) });
  } catch (error) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'That email, phone, or provider account is already in use.' });
    next(error);
  }
});

// A server-backed demo account keeps local previews fully functional (orders,
// chat and auctions) without pretending that a Google/Apple token was checked.
// This route does not exist in production.
router.post('/demo', authLimiter, async (req, res, next) => {
  try {
    if (env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found.' });
    const parsed = z.object({
      provider: z.enum(['google', 'apple']),
      role: z.enum(['shopper', 'business']).default('shopper'),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid demo account.' });
    const key = `${parsed.data.provider}:${parsed.data.role}`;
    let user = await prisma.user.findUnique({ where: { providerSubject: `demo:${key}` } });
    if (!user) {
      const phoneTail = ({
        'google:shopper': '101',
        'apple:shopper': '102',
        'google:business': '103',
        'apple:business': '104',
      })[key];
      user = await createUser({
        email: `demo-${parsed.data.role}-${parsed.data.provider}@liva.local`,
        passwordHash: await hashPassword(crypto.randomBytes(32).toString('hex')),
        firstName: 'Ava',
        lastName: parsed.data.role === 'business' ? 'Market' : 'Garcia',
        phone: `+971500000${phoneTail}`,
        country: 'AE',
        role: parsed.data.role,
        provider: parsed.data.provider,
        providerSubject: `demo:${key}`,
        businessName: parsed.data.role === 'business' ? 'Ava Live Market' : null,
        businessCategory: parsed.data.role === 'business' ? 'Lifestyle' : null,
        businessAddress: parsed.data.role === 'business' ? 'Dubai, UAE' : null,
        plan: parsed.data.role === 'business' ? 'growth' : null,
        billing: parsed.data.role === 'business' ? 'monthly' : null,
        subscriptionStatus: parsed.data.role === 'business' ? 'active' : null,
        verified: true,
      });
    }
    res.json({ token: signToken(user.id), user: publicUser(user), demo: true });
  } catch (error) { next(error); }
});

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });
    }
    const {
      email, password, firstName, lastName, phone, country, dob, role, provider,
      businessName, businessCategory, businessAddress, taxId, plan, billing, planPaymentId,
    } = parsed.data;

    if (await findByEmail(email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    if (await findByPhone(phone)) {
      return res.status(409).json({ error: 'This phone number is already linked to another account.' });
    }

    let planPayment = null;
    if (role === 'business') {
      planPayment = await verifyBusinessPlanPayment({
        paymentIntentId: planPaymentId,
        email,
        plan,
        billing,
      });
      if (!planPayment.ok) return res.status(402).json({ error: planPayment.reason || 'Plan payment is required.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email:        email.trim(),
      passwordHash,
      firstName:    firstName.trim(),
      lastName:     lastName.trim(),
      phone:        phone.trim(),
      country:      country.trim(),
      dob,
      role,
      provider,
      businessName: businessName?.trim(),
      businessCategory,
      businessAddress: businessAddress?.trim(),
      taxId: taxId?.trim(),
      plan,
      billing,
      planRenewsAt: plan
        ? new Date(Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        : null,
      planPaymentId,
      stripeCustomerId: planPayment?.customerId || null,
      subscriptionStatus: role === 'business' ? 'active' : null,
    });
    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    if (err?.code === 'P2002') {
      const fields = Array.isArray(err.meta?.target) ? err.meta.target.join(',') : String(err.meta?.target || 'account');
      return res.status(409).json({ error: fields.includes('phone')
        ? 'This phone number is already linked to another account.'
        : 'An account with this email already exists.' });
    }
    next(err);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const user = await findByEmail(parsed.data.email);
    // Timing-safe response: always run verify even on missing user (bcrypt
    // handles null gracefully). Same error message for both cases so an
    // attacker can't enumerate registered emails.
    const ok = user && await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.userPublic });
});

// Always return the same response, even when an email is unknown. This keeps
// the endpoint from becoming an account-enumeration oracle.
router.post('/password-reset/request', authLimiter, async (req, res, next) => {
  try {
    const parsed = resetRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email.' });

    const user = await findByEmail(parsed.data.email);
    if (!user || user.provider !== 'email') {
      return res.status(202).json({ ok: true });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    await prisma.$transaction([
      prisma.passwordResetCode.deleteMany({ where: { userId: user.id, consumedAt: null } }),
      prisma.passwordResetCode.create({
        data: {
          userId: user.id,
          codeHash: resetDigest(user.id, code),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      }),
    ]);

    try {
      await sendPasswordResetCode({ email: user.email, firstName: user.firstName, code });
    } catch (error) {
      console.error('[auth/password-reset/request] email delivery failed', error);
    }

    res.status(202).json({
      ok: true,
      ...(env.NODE_ENV !== 'production' ? { devCode: code } : {}),
    });
  } catch (err) { next(err); }
});

router.post('/password-reset/confirm', authLimiter, async (req, res, next) => {
  try {
    const parsed = resetConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid reset request.' });
    }

    const user = await findByEmail(parsed.data.email);
    if (!user) return res.status(400).json({ error: 'The code is invalid or expired.' });
    const reset = await prisma.passwordResetCode.findFirst({
      where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!reset || reset.attempts >= 5) {
      return res.status(400).json({ error: 'The code is invalid or expired.' });
    }

    const actual = Buffer.from(resetDigest(user.id, parsed.data.code), 'hex');
    const expected = Buffer.from(reset.codeHash, 'hex');
    const valid = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    if (!valid) {
      await prisma.passwordResetCode.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } });
      return res.status(400).json({ error: 'The code is invalid or expired.' });
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.passwordResetCode.update({ where: { id: reset.id }, data: { consumedAt: new Date() } }),
    ]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
