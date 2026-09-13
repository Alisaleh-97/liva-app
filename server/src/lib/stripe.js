// Lazy Stripe init — server still boots without a key; only payment routes 500.
import Stripe from 'stripe';
import { env } from './env.js';

let _client = null;
export function getStripe() {
  if (_client) return _client;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set. Add it to server/.env then restart.');
  }
  _client = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' });
  return _client;
}

export const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

export async function verifyBusinessPlanPayment({ paymentIntentId, email, plan, billing }) {
  if (!stripeConfigured) {
    return env.NODE_ENV !== 'production' && String(paymentIntentId).startsWith('pi_mock_plan_')
      ? { ok: true, customerId: null }
      : { ok: false, reason: 'Business payments are not configured.' };
  }

  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  const meta = intent.metadata || {};
  const valid = intent.status === 'succeeded'
    && meta.purpose === 'business_plan'
    && meta.email === String(email).trim().toLowerCase()
    && meta.plan === plan
    && meta.billing === billing;
  return valid
    ? { ok: true, customerId: typeof intent.customer === 'string' ? intent.customer : intent.customer?.id || null }
    : { ok: false, reason: 'The plan payment was not completed or does not match this account.' };
}

if (!stripeConfigured) {
  console.warn('[liva-server] STRIPE_SECRET_KEY is not set. /api/payments/* will return mock responses.');
}
