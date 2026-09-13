// Thin AsyncStorage wrapper for JSON values.
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const KEYS = {
  wishlist: '@liva/wishlist',
  orders: '@liva/orders',
  extras: '@liva/extras',
  sellerProducts: '@liva/sellerProducts',
  sellerOrders: '@liva/sellerOrders',
  promotions: '@liva/promotions',
  payouts: '@liva/payouts',
  addresses: '@liva/addresses',
  paymentMethods: '@liva/paymentMethods',
  loyalty: '@liva/loyalty',
  affiliate: '@liva/affiliate',
  academyProgress: '@liva/academyProgress',
  reviews: '@liva/reviews',
  recentSearches: '@liva/recentSearches',
  streak: '@liva/streak',
  notifications: '@liva/notifications',
  conversations: '@liva/conversations',
  recentlyViewed: '@liva/recentlyViewed',
  followedSellers: '@liva/followedSellers',
  savedSearches: '@liva/savedSearches',
  preferences: '@liva/preferences',
  onboardingShown: '@liva/onboardingShown',
  savedStreams: '@liva/savedStreams',
} as const;
