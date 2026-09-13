// Jest global setup — silences noisy warnings and mocks the native modules
// that don't have a JS implementation (SecureStore, Haptics, Notifications).

// SecureStore has no JS-side impl — mock as an in-memory Map
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    setItemAsync: async (k, v) => { store.set(k, v); },
    getItemAsync: async (k) => store.get(k) ?? null,
    deleteItemAsync: async (k) => { store.delete(k); },
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: () => {},
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[test]' }),
}));

// Silence the react-native-reanimated warning; it's initialized in native code
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Silence the AsyncStorage native-module warning in tests
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
