/**
 * QuietSend service worker.
 *
 * Strategy:
 *   - Navigation / HTML requests → network-first with offline fallback.
 *     The SW file itself is served with no-cache headers by every major
 *     host, so the browser re-runs install on every deploy and the cache
 *     name rotates automatically.
 *   - Hashed /assets/* → cache-first (the hash guarantees freshness).
 *   - Cross-origin and range requests → pass through untouched.
 *
 * The previous scheme used cache-first for everything including HTML and
 * the SW script itself, which pinned every visitor to the first version
 * they ever loaded. A security fix could not reach anyone who had already
 * visited the site.
 */

// Injected at build time by vite.config.ts via define; falls back to a
// timestamp so local dev always gets a fresh cache.
const BUILD_ID = typeof __SW_BUILD_ID__ !== 'undefined' ? __SW_BUILD_ID__ : String(Date.now());
const CACHE_NAME = `quietsend-v3-${BUILD_ID}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

// ── Install: precache the shell ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: evict stale caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('quietsend-v3-') && k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route by request type ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin GET requests. Let cross-origin (Google Fonts
  // previously) and non-GET pass through unchanged.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Never intercept range requests — the browser uses these for <video>
  // seeking and needs a real 206 from the server, not a 200 from cache.
  if (request.headers.get('range')) return;

  const url = new URL(request.url);

  // Hashed assets are content-addressed — cache-first is safe and fast.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      // These are same-origin static files. Their bytes do not vary by Origin,
      // but preview/CDN CORS headers can add Vary: Origin. Match precached
      // fetches against module-script requests even when their headers differ.
      caches.open(CACHE_NAME).then((cache) => cache.match(request, { ignoreVary: true })).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return resp;
        });
      })
    );
    return;
  }

  // Navigation and HTML — network-first so updates reach users on the next
  // page load, with the cached shell as the offline fallback.
  event.respondWith(
    fetch(request)
      .then((resp) => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});
