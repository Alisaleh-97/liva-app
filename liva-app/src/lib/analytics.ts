// Analytics — thin wrapper around PostHog. Events queue silently when unconfigured
// (dev), fire for real when EXPO_PUBLIC_POSTHOG_KEY is set.
//
// To turn on:
//   1. `npx expo install posthog-react-native`
//   2. Set EXPO_PUBLIC_POSTHOG_KEY and (optionally) EXPO_PUBLIC_POSTHOG_HOST
//   3. init(anonId) from App.tsx on mount, identify(user.id) after login.

const KEY  = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const enabled = !!KEY;

let posthog: any = null;

async function getClient(): Promise<any> {
  if (!enabled || posthog) return posthog;
  try {
    // @ts-ignore — optional peer
    const { PostHog } = await import('posthog-react-native');
    posthog = new PostHog(KEY!, { host: HOST });
    return posthog;
  } catch {
    return null;
  }
}

// Type-safe event catalogue — every event the app fires should live here so
// dashboards stay coherent. Adding a new event → add its name + payload here.
export type LivaEvent =
  | { name: 'app_open';              props?: never }
  | { name: 'sign_up';               props: { role: 'shopper' | 'business'; provider: 'email' | 'google' | 'apple' } }
  | { name: 'sign_in';               props: { provider: 'email' | 'google' | 'apple' } }
  | { name: 'product_view';          props: { productId: string; type: string; price: number } }
  | { name: 'add_to_wishlist';       props: { productId: string } }
  | { name: 'checkout_started';      props: { productId: string; total: number } }
  | { name: 'purchase';              props: { productId: string; total: number; qty: number } }
  | { name: 'live_stream_joined';    props: { streamId: string; sellerId: string } }
  | { name: 'auction_bid';           props: { auctionId: string; amount: number } }
  | { name: 'search';                props: { q: string; results: number } };

/** Fire a typed event. No-ops (with a dev console log) when PostHog isn't configured. */
export async function track<E extends LivaEvent>(event: E['name'], props?: E extends { props: infer P } ? P : never): Promise<void> {
  if (__DEV__ && !enabled) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event, props ?? {});
    return;
  }
  const c = await getClient();
  if (!c) return;
  try { c.capture(event, props); }
  catch { /* never throw from telemetry */ }
}

/** Bind subsequent events to a signed-in user. */
export async function identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
  if (!enabled) return;
  const c = await getClient();
  if (!c) return;
  try { c.identify(userId, traits); } catch { /* no-op */ }
}

/** Clear identity on sign-out so the next session starts anonymous. */
export async function resetAnalytics(): Promise<void> {
  if (!enabled) return;
  const c = await getClient();
  if (!c) return;
  try { c.reset(); } catch { /* no-op */ }
}

export const analyticsEnabled = enabled;
