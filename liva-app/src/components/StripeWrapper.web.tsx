// Web shim — Stripe React Native's SDK doesn't work in browsers, so the web
// build skips the provider entirely. payWithSheet() handles web with a mock
// success path so checkout still progresses in preview.
import React from 'react';

export function StripeWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
