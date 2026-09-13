// Cross-platform geolocation. Uses browser navigator.geolocation on web (works
// natively, no extra dep), falls back to a polite manual-entry prompt on native
// since we haven't shipped expo-location yet. Add expo-location later and swap
// the native path for `Location.getCurrentPositionAsync()`.
import { Platform } from 'react-native';

export interface GeoCoords { latitude: number; longitude: number; accuracy?: number; }

export async function getCurrentPosition(): Promise<GeoCoords> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => reject(new Error(err.message || 'Location denied')),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }
  throw new Error('Auto-detect requires the native location module on this platform. Please fill in your address manually.');
}

// Cheap reverse-geocode via Nominatim (no API key). Use a custom backend in prod.
export async function reverseGeocode(lat: number, lng: number): Promise<{
  street?: string; city?: string; state?: string; country?: string; zip?: string;
}> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { 'User-Agent': 'LIVA-app/0.1' },
    });
    if (!res.ok) return {};
    const json: any = await res.json();
    const a = json.address || {};
    return {
      street: [a.house_number, a.road].filter(Boolean).join(' '),
      city: a.city || a.town || a.village || a.suburb,
      state: a.state || a.region,
      country: a.country,
      zip: a.postcode,
    };
  } catch {
    return {};
  }
}
