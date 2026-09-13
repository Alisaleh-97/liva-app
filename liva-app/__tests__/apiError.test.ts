// ApiError — verifies our HTTP status → user-friendly message mapping.
// End-users should never see "Request failed: 500" from any code path.

import { ApiError, apiListProducts } from '@/lib/api';

describe('ApiError status mapping via failing fetch', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => { globalThis.fetch = realFetch; });

  function mockStatus(status: number, body: any = {}) {
    globalThis.fetch = (async () => ({
      ok: false,
      status,
      json: async () => body,
    })) as any;
  }

  it('turns a 429 into a rate-limit message', async () => {
    mockStatus(429);
    await expect(apiListProducts()).rejects.toMatchObject({
      name: 'ApiError',
      status: 429,
      message: expect.stringMatching(/wait a minute|too many/i),
    });
  });

  it('turns a 500 into a friendly server message', async () => {
    mockStatus(500);
    await expect(apiListProducts()).rejects.toMatchObject({
      status: 500,
      message: expect.stringMatching(/hiccup|try again/i),
    });
  });

  it('turns a 403 into a permission message', async () => {
    mockStatus(403);
    await expect(apiListProducts()).rejects.toMatchObject({
      status: 403,
      message: expect.stringMatching(/access/i),
    });
  });

  it('prefers the server-provided error message when present', async () => {
    mockStatus(400, { error: 'Phone number is already linked to another account.' });
    await expect(apiListProducts()).rejects.toMatchObject({
      status: 400,
      message: 'Phone number is already linked to another account.',
    });
  });

  it('is a real ApiError so callers can instanceof-check', async () => {
    mockStatus(429);
    try {
      await apiListProducts();
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
    }
  });
});
