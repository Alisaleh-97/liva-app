// Analytics no-op behaviour — when PostHog isn't configured (dev / tests),
// track()/identify() log to console but never throw. This guards against a
// missing analytics service crashing the app boot.

import { track, identify, resetAnalytics, analyticsEnabled } from '@/lib/analytics';

describe('analytics', () => {
  it('is disabled when EXPO_PUBLIC_POSTHOG_KEY is unset', () => {
    expect(analyticsEnabled).toBe(false);
  });

  it('track() never throws even for unknown events', async () => {
    await expect(track('app_open')).resolves.toBeUndefined();
    // Typed events with props
    await expect(track('purchase', { productId: 'p1', total: 42, qty: 1 })).resolves.toBeUndefined();
  });

  it('identify() is a no-op when disabled', async () => {
    await expect(identify('u_test', { email: 't@t.com' })).resolves.toBeUndefined();
  });

  it('resetAnalytics() is a no-op when disabled', async () => {
    await expect(resetAnalytics()).resolves.toBeUndefined();
  });
});
