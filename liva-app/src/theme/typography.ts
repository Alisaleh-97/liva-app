// Typography — iOS-native SF Pro when possible, with visually-close fallbacks
// on other platforms. Applied globally via Text.defaultProps in App.tsx so
// every screen inherits the family without touching individual styles.

import { Platform } from 'react-native';

// The full SF-first stack for web. iOS falls back to system SF automatically
// when we pass "System". Android uses Roboto (its native SF-equivalent).
const WEB_STACK = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"SF Pro Display"',
  '"SF Pro Text"',
  '"Segoe UI Variable Text"',
  '"Segoe UI"',
  'system-ui',
  'Roboto',
  'Helvetica',
  'Arial',
  'sans-serif',
].join(', ');

export const FONT_FAMILY: string = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: WEB_STACK,
  default: 'System',
})!;

// A single tightly-spaced number family for prices / bid counts.
// Slightly wider fallback stack that includes SF Pro Rounded on Apple.
export const FONT_FAMILY_NUM: string = Platform.select({
  ios: 'System',
  web: `"SF Pro Rounded", ${WEB_STACK}`,
  default: 'System',
})!;
