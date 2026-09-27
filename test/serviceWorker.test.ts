import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

describe('Offline production assets', () => {
  it('serves a precached module offline despite Vary: Origin on the server response', async () => {
    const handlers = new Map<string, (event: any) => void>();
    const cachedModule = { status: 200, body: 'cached JavaScript module' };
    // Emulate CacheStorage matching: the precache fetch had no Origin header,
    // while a crossorigin module request does. A normal match misses it.
    const match = vi.fn(async (_request, options) => options?.ignoreVary ? cachedModule : undefined);
    const fetch = vi.fn(async () => { throw new Error('Network offline'); });
    runInNewContext(readFileSync('public/sw.js', 'utf8'), {
      __SW_BUILD_ID__: 'offline-regression',
      self: {
        location: { origin: 'https://quietsend.test' },
        addEventListener: (name: string, handler: (event: any) => void) => handlers.set(name, handler),
      },
      caches: { open: async () => ({ match }) },
      fetch,
      URL,
    });
    let response: Promise<unknown> | undefined;
    handlers.get('fetch')!({
      request: {
        url: 'https://quietsend.test/assets/index-test.js',
        method: 'GET',
        headers: { get: () => null },
      },
      respondWith: (value: Promise<unknown>) => { response = value; },
    });
    await expect(response).resolves.toBe(cachedModule);
    expect(fetch).not.toHaveBeenCalled();
  });
});
