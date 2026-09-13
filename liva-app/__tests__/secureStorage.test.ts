// SecureStorage wrapper — the mock in jest.setup.js gives us an in-memory
// implementation, so these tests exercise the code path that runs on native.

import { setSecure, getSecure, deleteSecure, SECURE_KEYS } from '@/lib/secureStorage';

describe('SecureStorage wrapper', () => {
  it('stores and retrieves a value', async () => {
    await setSecure(SECURE_KEYS.authToken, 'test-token-xyz');
    expect(await getSecure(SECURE_KEYS.authToken)).toBe('test-token-xyz');
  });

  it('returns null for a missing key', async () => {
    await deleteSecure(SECURE_KEYS.authToken);
    expect(await getSecure(SECURE_KEYS.authToken)).toBeNull();
  });

  it('deletes a stored value', async () => {
    await setSecure('temp:key', 'delete-me');
    await deleteSecure('temp:key');
    expect(await getSecure('temp:key')).toBeNull();
  });
});
