// Cloudinary image upload — unsigned preset (no server signature needed).
// Falls back to using the local URI directly if Cloudinary isn't configured,
// which means the image still shows in-app via the device cache.

import * as ImagePicker from 'expo-image-picker';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfigured = !!(CLOUD_NAME && UPLOAD_PRESET);

export async function pickImage(opts: { square?: boolean } = {}): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: opts.square ? [1, 1] : undefined,
    quality: 0.8,
  });
  if (res.canceled) return null;
  return res.assets[0]?.uri ?? null;
}

export async function takePhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (res.canceled) return null;
  return res.assets[0]?.uri ?? null;
}

/**
 * Uploads a local file URI to Cloudinary. Returns the secure CDN URL.
 * If Cloudinary isn't configured, returns the local URI unchanged — the image
 * still works in the running session, it just won't persist across reinstalls.
 */
export async function uploadImage(localUri: string): Promise<string> {
  if (!cloudinaryConfigured) return localUri;
  try {
    const form = new FormData();
    // React Native FormData supports the {uri, type, name} shape
    form.append('file', { uri: localUri, type: 'image/jpeg', name: 'photo.jpg' } as any);
    form.append('upload_preset', UPLOAD_PRESET!);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const json: any = await res.json();
    if (json.secure_url) return json.secure_url;
    return localUri;
  } catch {
    return localUri;
  }
}
