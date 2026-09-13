// Push notifications via Expo's relay (proxies to APNs + FCM for free in dev).
// Works on a physical device immediately — no Apple Developer / Google FCM
// account needed for development.
//
// On web (preview mode) this short-circuits to no-op.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from './api';
import { getSecure, SECURE_KEYS } from './secureStorage';

let _Notifications: typeof import('expo-notifications') | null = null;
let _Device: typeof import('expo-device') | null = null;

async function loadNative() {
  if (Platform.OS === 'web') return null;
  if (!_Notifications) {
    _Notifications = await import('expo-notifications');
    _Device = await import('expo-device');
    _Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return _Notifications;
}

export async function registerForPushNotifications(): Promise<string | null> {
  const N = await loadNative();
  if (!N) return null;
  if (!_Device?.isDevice) return null;
  const { status: existing } = await N.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await N.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return null;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  const token = (await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;

  // Tell the backend this user has this token (best-effort)
  const authToken = await getSecure(SECURE_KEYS.authToken).catch(() => null);
  if (authToken) {
    fetch(`${API_URL}/api/notifications/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ token, platform: Platform.OS }),
    }).catch(() => {});
  }

  return token;
}

/** Schedule a local notification (works offline; great for "live starting in 5 min"). */
export async function scheduleLocal(title: string, body: string, seconds: number) {
  const N = await loadNative();
  if (!N) return;
  await N.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: { seconds: Math.max(1, Math.floor(seconds)) } as any,
  });
}

/** Ask the backend to send a remote push (for cross-device delivery in prod). */
export async function sendRemotePush(_to: string, title: string, body: string, data?: any) {
  try {
    const authToken = await getSecure(SECURE_KEYS.authToken);
    if (!authToken) return;
    await fetch(`${API_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ title, body, data }),
    });
  } catch {}
}
