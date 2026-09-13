// Error reporting — sends caught exceptions + user context to Sentry when
// EXPO_PUBLIC_SENTRY_DSN is set, else no-ops (dev + preview stay quiet).
//
// The real @sentry/react-native SDK is loaded lazily so this file adds
// nothing to the bundle when Sentry isn't configured. To turn it on:
//   1. `npx expo install @sentry/react-native`
//   2. Set EXPO_PUBLIC_SENTRY_DSN in .env
//   3. That's it — captureError/setUser/init all start wiring through.

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const enabled = !!DSN;

let Sentry: any = null;
async function getSentry() {
  if (!enabled || Sentry) return Sentry;
  try {
    // @ts-ignore — optional peer, only present when the user installs it
    Sentry = await import('@sentry/react-native');
    return Sentry;
  } catch {
    return null;
  }
}

let initialized = false;
export async function initErrorReporting(): Promise<void> {
  if (!enabled || initialized) return;
  const s = await getSentry();
  if (!s) return;
  s.init({
    dsn: DSN,
    // Attach breadcrumbs from console, native events, HTTP requests
    tracesSampleRate: 0.1,
    debug: __DEV__,
  });
  initialized = true;
}

export async function captureError(err: unknown, extra?: Record<string, unknown>): Promise<void> {
  if (__DEV__) console.error('[errorReporting]', err, extra);
  if (!enabled) return;
  const s = await getSentry();
  if (!s) return;
  try {
    s.captureException(err, extra ? { extra } : undefined);
  } catch {
    // Never let error reporting itself throw
  }
}

export async function setErrorUser(user: { id: string; email?: string } | null): Promise<void> {
  if (!enabled) return;
  const s = await getSentry();
  if (!s) return;
  try {
    s.setUser(user ? { id: user.id, email: user.email } : null);
  } catch { /* no-op */ }
}

export const errorReportingEnabled = enabled;
