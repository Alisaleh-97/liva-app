// Backend client. Base URL comes from EXPO_PUBLIC_API_URL or app.json's extra.apiUrl.
// On web dev mode we prefer the same hostname the browser is on (usually
// localhost), since fetches to a LAN IP from the browser can fail CORS / TLS.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Auction } from '@/data/auctions';

function pickApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    // Anything but localhost — use the env value the user explicitly set
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${window.location.protocol}//${host}:3001`;
    }
  }
  return fromEnv || fromExtra || 'http://localhost:3001';
}

export const API_URL = pickApiUrl();

/** Error subclass thrown by every API helper — carries the HTTP status so UI
 *  can special-case 401 (re-auth), 429 (rate-limit), or 5xx (server down). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Turn a server response into an ApiError with a human-friendly message.
 *  Prefer the server's `error` field, else map common statuses to something
 *  readable. Never leaks a bare "Request failed: 500" to end users. */
function toApiError(status: number, body: unknown): ApiError {
  const serverMsg = (body as { error?: string })?.error;
  if (serverMsg) return new ApiError(serverMsg, status);
  const generic =
    status === 401 ? 'Please sign in again.' :
    status === 403 ? "You don't have access to that." :
    status === 404 ? 'Not found.' :
    status === 409 ? 'That already exists or conflicts with something.' :
    status === 429 ? 'Too many requests — please wait a minute and try again.' :
    status >= 500  ? "Our servers hiccuped. We're on it — try again shortly." :
                     `Request failed (${status})`;
  return new ApiError(generic, status);
}

// ── Auth API ────────────────────────────────────────────────────────────
// Server responses; the client stores `token` in SecureStore.
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'shopper' | 'business';
  provider: 'email' | 'google' | 'apple';
  country?: string;
  dob?: string;
  businessName?: string;
  businessCategory?: string;
  businessAddress?: string;
  taxId?: string;
  plan?: 'starter' | 'growth' | 'pro';
  billing?: 'monthly' | 'yearly';
  planRenewsAt?: string | number;
  verified?: boolean;
  createdAt: string | number;
}
export interface AuthResponse { token: string; user: AuthUser }

async function authRequest<T>(path: string, body?: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw toApiError(res.status, json);
  return json as T;
}

export function apiRegister(input: {
  email: string; password: string; firstName: string; lastName: string;
  phone: string; country: string; dob?: string;
  role?: 'shopper' | 'business'; provider?: 'email';
  businessName?: string; businessCategory?: string; businessAddress?: string;
  taxId?: string; plan?: 'starter' | 'growth' | 'pro'; billing?: 'monthly' | 'yearly';
  planPaymentId?: string;
}): Promise<AuthResponse> {
  return authRequest<AuthResponse>('/api/auth/register', input);
}

export function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return authRequest<AuthResponse>('/api/auth/login', { email, password });
}

export function apiMe(token: string): Promise<{ user: AuthUser }> {
  return authRequest<{ user: AuthUser }>('/api/auth/me', undefined, token);
}

export function apiRequestPasswordReset(email: string): Promise<{ ok: true; devCode?: string }> {
  return authRequest<{ ok: true; devCode?: string }>('/api/auth/password-reset/request', { email });
}

export function apiResetPassword(email: string, code: string, newPassword: string): Promise<{ ok: true }> {
  return authRequest<{ ok: true }>('/api/auth/password-reset/confirm', { email, code, newPassword });
}

export interface OAuthStartResponse {
  token?: string;
  user?: AuthUser;
  requiresRegistration: boolean;
  registrationToken?: string;
  profile?: {
    provider: 'google' | 'apple';
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function apiOAuthStart(
  provider: 'google' | 'apple',
  credential: string,
  names?: { firstName?: string; lastName?: string },
): Promise<OAuthStartResponse> {
  return authRequest<OAuthStartResponse>('/api/auth/oauth/start', { provider, credential, ...names });
}

export function apiOAuthComplete(input: {
  registrationToken: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  dob?: string;
  role: 'shopper' | 'business';
  businessName?: string;
  businessCategory?: string;
  businessAddress?: string;
  taxId?: string;
  plan?: 'starter' | 'growth' | 'pro';
  billing?: 'monthly' | 'yearly';
  planPaymentId?: string;
}): Promise<AuthResponse> {
  return authRequest<AuthResponse>('/api/auth/oauth/complete', input);
}

export function apiDemoSignIn(provider: 'google' | 'apple', role: 'shopper' | 'business'): Promise<AuthResponse> {
  return authRequest<AuthResponse>('/api/auth/demo', { provider, role });
}

// ── Products / Search / Orders ─────────────────────────────────────────
// Server product shape. Slightly leaner than the mobile app's local Product
// interface — the client adapter fills in the seed-only fields (sizes/colors)
// from the local catalog when they're missing.
export interface ServerProduct {
  id: string;
  sellerId: string;
  name: string;
  nameAr?: string;
  brand?: string;
  audience: string;
  type: string;
  sub?: string;
  price: number;
  was?: number;
  rating: number;
  reviews: number;
  seed: string;
  imageUrls: string[];
  badge?: string | null;
  stock: number;
  shipFrom: number;
  shipTo: number;
  install: boolean;
  active: boolean;
}

export interface ProductListParams {
  type?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'new' | 'price_asc' | 'price_desc' | 'rating';
  take?: number;
  skip?: number;
}

async function jsonRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw toApiError(res.status, json);
  return json as T;
}

export function apiListProducts(params: ProductListParams = {}): Promise<{ total: number; items: ServerProduct[] }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, String(v));
  const q = qs.toString();
  return jsonRequest(`/api/products${q ? `?${q}` : ''}`);
}

export function apiSearchProducts(q: string): Promise<{ q: string; total: number; items: ServerProduct[]; suggestions: string[] }> {
  return jsonRequest(`/api/search?q=${encodeURIComponent(q)}`);
}

export interface ServerOrder {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  qty: number;
  unitPrice: number;
  total: number;
  status: 'confirmed' | 'packed' | 'shipped' | 'ofd' | 'delivered' | 'cancelled';
  addressLine?: string;
  deliverySlot?: string;
  paymentMethod?: 'stripe' | 'cod';
  paymentStatus?: 'paid' | 'cod_pending' | 'refunded';
  paymentAttemptId?: string;
  placedAt: string;
  product?: ServerProduct;
}

export function apiCreateOrder(
  token: string,
  input: { checkoutId: string; addressLine: string; deliverySlot?: 'same_day' | 'morning' | 'evening' | 'weekend' },
): Promise<{ order: ServerOrder }> {
  return jsonRequest('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
}

export function apiMyOrders(token: string): Promise<{ orders: ServerOrder[] }> {
  return jsonRequest('/api/orders/mine', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// �� Live auctions �������������������������������������������������������
export function apiListAuctions(): Promise<{ serverTime: number; auctions: Auction[] }> {
  return jsonRequest('/api/auctions');
}

export function apiGetAuction(id: string): Promise<{ serverTime: number; auction: Auction }> {
  return jsonRequest(`/api/auctions/${encodeURIComponent(id)}`);
}

export function apiPlaceAuctionBid(
  token: string,
  auctionId: string,
  amount: number,
  requestId: string,
): Promise<{ serverTime: number; auction: Auction }> {
  return jsonRequest(`/api/auctions/${encodeURIComponent(auctionId)}/bids`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, requestId }),
  });
}

export function realtimeUrl(): string {
  return API_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:') + '/realtime';
}

export function apiUploadImage(token: string, formData: FormData): Promise<{ url: string; size: number; type: string }> {
  return fetch(`${API_URL}/api/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // don't set Content-Type — the browser adds the boundary
    body: formData,
  }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw toApiError(r.status, j);
    return j;
  });
}

export interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string; }

export interface ChatResponse {
  text: string;
  productIds?: string[];
  chips?: string[];
}

export async function aiChat(history: ChatMessage[]): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export interface ExtractResponse {
  name: string;
  brand?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  error?: string;
}

export async function aiExtract(url: string): Promise<ExtractResponse> {
  const res = await fetch(`${API_URL}/api/ai/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`Extract failed: ${res.status}`);
  return res.json();
}
