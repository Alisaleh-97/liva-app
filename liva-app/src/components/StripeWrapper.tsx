// Default (native) — wraps children in @stripe/stripe-react-native's provider.
// The .web.tsx companion file is a pass-through so the web bundle never imports
// Stripe's native module.
import React from 'react';
import { stripePublishableKey, stripeConfigured } from '@/lib/payments';
import { StripeProvider } from '@stripe/stripe-react-native';

export function StripeWrapper({ children }: { children: React.ReactNode }) {
  if (!stripeConfigured) return <>{children}</>;
  return (
    <StripeProvider
      publishableKey={stripePublishableKey!}
      merchantIdentifier={process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID || 'merchant.com.liva.app'}
      urlScheme="liva"
    >
      {children as React.ReactElement}
    </StripeProvider>
  );
}
