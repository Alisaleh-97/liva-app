// Web shim — Stripe React Native's SDK isn't usable in browsers. Checkout
// still walks through the success path so preview works; real Stripe.js can
// be wired here later for production web shoppers.
import { API_URL } from './api';
import { getSecure, SECURE_KEYS } from './secureStorage';

export const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const stripeConfigured = !!stripePublishableKey;

export interface PaymentIntentResponse {
  checkoutId: string;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  productId: string;
  paymentRequired: boolean;
  mock?: boolean;
}

export type BusinessPlan = 'starter' | 'growth' | 'pro';
export type BusinessBilling = 'monthly' | 'yearly';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getSecure(SECURE_KEYS.authToken).catch(() => null);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface OrderPaymentInput {
  productId?: string;
  productSeed: string;
  qty: number;
  paymentMethod: 'stripe' | 'cod';
}

export interface OrderPaymentResult {
  checkoutId: string;
  paymentIntentId?: string;
  paymentMethod: 'stripe' | 'cod';
  amount: number;
  currency: string;
  mock?: boolean;
}

async function prepareOrderCheckout(input: OrderPaymentInput): Promise<PaymentIntentResponse> {
  const res = await fetch(`${API_URL}/api/payments/prepare-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Unable to start checkout (${res.status}).`);
  return body;
}

export async function createSetupIntent(): Promise<{ clientSecret: string; mock?: boolean }> {
  const res = await fetch(`${API_URL}/api/payments/create-setup-intent`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Setup intent failed: ${res.status}`);
  return res.json();
}

export async function payBusinessPlan(
  plan: BusinessPlan,
  billing: BusinessBilling,
  email: string,
): Promise<{ paymentIntentId: string; mock?: boolean }> {
  const response = await fetch(`${API_URL}/api/payments/prepare-business-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, billing, email }),
  });
  const intent = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(intent.error || `Unable to start payment (${response.status}).`);
  if (intent.mock) return { paymentIntentId: intent.paymentIntentId, mock: true };
  throw new Error('Complete the secure business-plan payment from the iOS or Android app.');
}

export async function payForOrder(input: OrderPaymentInput): Promise<OrderPaymentResult> {
  const intent = await prepareOrderCheckout(input);
  const result = {
    checkoutId: intent.checkoutId,
    paymentIntentId: intent.paymentIntentId,
    paymentMethod: input.paymentMethod,
    amount: intent.amount,
    currency: intent.currency,
    mock: intent.mock,
  };
  if (!intent.paymentRequired || input.paymentMethod === 'cod' || intent.mock) return result;
  throw new Error('Complete secure card payment from the iOS or Android app.');
}
