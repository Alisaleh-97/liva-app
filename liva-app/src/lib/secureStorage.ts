// Cross-platform secure storage — expo-secure-store on native (uses Keychain
// on iOS, EncryptedSharedPreferences on Android) with an AsyncStorage
// fallback on web where SecureStore isn't available.
//
// Use for anything sensitive: auth tokens, refresh tokens, biometric flags.
// Do NOT use for large data blobs — SecureStore has small size limits.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Loaded lazily so the web bundle doesn't pull in the native module.
let secureStore: typeof import('expo-secure-store') | null = null;
function getSecureStore() {
  if (Platform.OS === 'web') return null;
  if (!secureStore) secureStore = require('expo-secure-store');
  return secureStore;
}

export async function setSecure(key: string, value: string): Promise<void> {
  const s = getSecureStore();
  if (s) {
    await s.setItemAsync(key, value);
  } else {
    // Web fallback — AsyncStorage backed by localStorage. Not truly secure,
    // but preview / web-shell only. Production web app should use httpOnly
    // cookies for the JWT instead.
    await AsyncStorage.setItem('secure:' + key, value);
  }
}

export async function getSecure(key: string): Promise<string | null> {
  const s = getSecureStore();
  if (s) return s.getItemAsync(key);
  return AsyncStorage.getItem('secure:' + key);
}

export async function deleteSecure(key: string): Promise<void> {
  const s = getSecureStore();
  if (s) {
    await s.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem('secure:' + key);
  }
}

// Well-known keys — centralised so we don't sprinkle string literals.
export const SECURE_KEYS = {
  authToken: 'liva.authToken',
} as const;
