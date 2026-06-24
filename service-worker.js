// Wildsea GM Toolkit — Service Worker
// Update CACHE_VERSION when deploying changed files to force a refresh.

const CACHE_VERSION = 'wildsea-v1';

const PRECACHE_URLS = [
  '/wildsea-toolkit/index.html',
  '/wildsea-toolkit/manifest.json',
  '/wildsea-toolkit/icon-192.png',
  '/wildsea-toolkit/icon-512.png',
  '/wildsea-toolkit/wildsea-locations-traders-npcs.html',
  '/wildsea-toolkit/wildsea-creatures.html',
  '/wildsea-toolkit/wildsea-random-items v2.html',
  '/wildsea-toolkit/wildsea-relics.html',
  '/wildsea-toolkit/wildsea-ships.html',
  '/wildsea-toolkit/wildsea-encounters.html',
  '/wildsea-toolkit/wildsea-tracker-slim v2.html',
  '/wildsea-toolkit/wildsea-journey-tracker v2.html',
  '/wildsea-toolkit/wildsea-character-sheet v3.html',
];

// ── Install: cache everything ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for precached files, network-first for everything else ──
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For same-origin HTML files: cache-first (fast at the table)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached;
          // Not in cache — fetch and store
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200 || response.type === 'opaque') {
                return response;
              }
              const clone = response.clone();
              caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
              return response;
            });
        })
        .catch(() => {
          // Completely offline and not cached — nothing to show
          return new Response('Offline — this page has not been cached yet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // External requests (Anthropic API etc.) — always network, never cache
  // Let them pass through untouched
});
