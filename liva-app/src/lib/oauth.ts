// Real Google / Apple OAuth via expo-auth-session.
// Returns no-op stubs when client IDs aren't set so the rest of the app keeps
// working — RegistrationFlow then falls back to the demo SSO path.

import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_AND = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const APPLE_SVC  = process.env.EXPO_PUBLIC_APPLE_SERVICE_ID;

export const googleConfigured = !!(GOOGLE_IOS || GOOGLE_AND || GOOGLE_WEB);
export const appleConfigured = !!APPLE_SVC;

interface GoogleAuthHook {
  request: any;
  response: any;
  promptGoogle: (opts?: any) => Promise<any>;
  ready: boolean;
}

/**
 * Hook for Google OAuth. Only loads expo-auth-session/providers/google when
 * at least one client ID is configured — otherwise returns a stub so React's
 * hook rules are still satisfied (we always call the same hook count) but the
 * app doesn't crash trying to initialize a request with no credentials.
 */
export function useGoogleAuth(): GoogleAuthHook {
  if (!googleConfigured) {
    return {
      request: null,
      response: null,
      promptGoogle: async () => ({ type: 'dismiss' }),
      ready: false,
    };
  }
  // Lazy require — only runs when configured (after the early return above).
  // Note: this technically breaks rules-of-hooks for the conditional path, but
  // because `googleConfigured` is a module-level constant the branch never
  // changes between renders, so React's hook order stays consistent.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Google = require('expo-auth-session/providers/google');
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS,
    androidClientId: GOOGLE_AND,
    webClientId: GOOGLE_WEB,
    scopes: ['profile', 'email'],
  });
  return { request, response, promptGoogle: promptAsync, ready: !!request };
}

/** Sign in with Apple — only available on iOS when configured. */
export async function signInWithAppleNative(): Promise<{ name?: string; firstName?: string; lastName?: string; email?: string; identityToken?: string } | null> {
  if (!appleConfigured || Platform.OS !== 'ios') return null;
  try {
    // Optional peer — only present when Sign in with Apple is enabled for
    // the build. The @ts-ignore keeps TS happy without adding a hard dep.
    // @ts-ignore optional peer
    const AppleAuthentication = await import('expo-apple-authentication').catch(() => null) as any;
    if (!AppleAuthentication) return null;
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    return {
      name: credential.fullName ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim() : undefined,
      firstName: credential.fullName?.givenName ?? undefined,
      lastName: credential.fullName?.familyName ?? undefined,
      email: credential.email ?? undefined,
      identityToken: credential.identityToken ?? undefined,
    };
  } catch {
    return null;
  }
}
