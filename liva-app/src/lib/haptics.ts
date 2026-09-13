// Tactile feedback helper — safe on web (no-op) and respects user preference.
import { Platform } from 'react-native';

let _Haptics: typeof import('expo-haptics') | null = null;

async function loadH() {
  if (Platform.OS === 'web') return null;
  if (!_Haptics) {
    try { _Haptics = await import('expo-haptics'); } catch { _Haptics = null; }
  }
  return _Haptics;
}

type Tap = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'select';

/** Fire-and-forget haptic. Always pass `enabled` from user preferences. */
export async function tap(kind: Tap, enabled = true) {
  if (!enabled) return;
  const H = await loadH();
  if (!H) return;
  try {
    switch (kind) {
      case 'light':   await H.impactAsync(H.ImpactFeedbackStyle.Light); break;
      case 'medium':  await H.impactAsync(H.ImpactFeedbackStyle.Medium); break;
      case 'heavy':   await H.impactAsync(H.ImpactFeedbackStyle.Heavy); break;
      case 'success': await H.notificationAsync(H.NotificationFeedbackType.Success); break;
      case 'warning': await H.notificationAsync(H.NotificationFeedbackType.Warning); break;
      case 'error':   await H.notificationAsync(H.NotificationFeedbackType.Error); break;
      case 'select':  await H.selectionAsync(); break;
    }
  } catch {}
}
