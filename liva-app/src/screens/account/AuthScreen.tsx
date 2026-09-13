// Auth entry point — defaults to RegistrationFlow (first-time users).
// "Already have an account? Sign in" toggles to the polished 2-step SignInScreen
// (email lookup → password) with SSO + forgot-password support.
import React, { useState } from 'react';
import { RegistrationFlow } from './RegistrationFlow';
import { SignInScreen } from './SignInScreen';

export function AuthScreen({ onClose }: { onClose?: () => void }) {
  const [mode, setMode] = useState<'register' | 'signin'>('register');

  if (mode === 'signin') {
    return (
      <SignInScreen
        onBack={() => setMode('register')}
        onWantSignUp={() => setMode('register')}
      />
    );
  }
  return <RegistrationFlow onWantSignIn={() => setMode('signin')} />;
}
