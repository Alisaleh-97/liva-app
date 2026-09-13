// User store — Prisma-backed. Same surface as the old file-based version
// (findByEmail, findByPhone, findById, createUser, publicUser) so callers
// don't need to change.

import { prisma } from './db.js';

// Normalize an email for lookup — Prisma unique index is case-sensitive
// on SQLite, so we store the lowercased form and always compare that way.
const norm = (s = '') => s.trim().toLowerCase();

// Strip common formatting so "+971 50 123 4567" matches "+971501234567".
const normPhone = (p = '') => {
  const t = p.trim().replace(/[\s\-()]/g, '');
  const sign = t.startsWith('+') ? '+' : '';
  return sign + t.replace(/\+/g, '').replace(/[^0-9]/g, '');
};

export async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email: norm(email) } });
}

export async function findByPhone(phone) {
  if (!phone) return null;
  return prisma.user.findUnique({ where: { phone: normPhone(phone) } });
}

export async function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(input) {
  // Caller is responsible for having already hashed the password.
  return prisma.user.create({
    data: {
      email:        norm(input.email),
      passwordHash: input.passwordHash,
      firstName:    input.firstName,
      lastName:     input.lastName,
      phone:        normPhone(input.phone),
      role:         input.role || 'shopper',
      provider:     input.provider || 'email',
      providerSubject: input.providerSubject || null,
      avatarSeed:   input.avatarSeed || `user-${norm(input.email)}`,
      country:      input.country || null,
      dob:          input.dob || null,
      businessName: input.businessName || null,
      businessCategory: input.businessCategory || null,
      businessAddress: input.businessAddress || null,
      taxId:        input.taxId || null,
      plan:         input.plan || null,
      billing:      input.billing || null,
      planRenewsAt: input.planRenewsAt || null,
      planPaymentId: input.planPaymentId || null,
      stripeCustomerId: input.stripeCustomerId || null,
      subscriptionStatus: input.subscriptionStatus || null,
      verified:     input.verified ?? false,
    },
  });
}

// Stripped-down user for API responses - never leak authentication or Stripe
// identifiers. The mobile app only needs the public subscription state.
export function publicUser(u) {
  if (!u) return null;
  const { passwordHash, planPaymentId, stripeCustomerId, providerSubject, ...safe } = u;
  return safe;
}
