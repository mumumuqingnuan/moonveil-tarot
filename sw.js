const CACHE_PREFIX = 'moonveil-tarot-';
const CACHE = `${CACHE_PREFIX}v1`;
const SHELL = [
  './', './index.html', './app.js', './data.js', './effects.js', './music.js',
  './snapshot.js', './style.css', './experience.css', './install.js', './install.css',
  './manifest.webmanifest', './assets/card-back.webp', './icons/icon.svg',
  './icons/icon-32.png', './icons/apple-touch-icon.png', './icons/icon-192.png',
  './icons/icon-512.png', './icons/icon-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(p => new URL(p, self.registration.scope).href))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(CACHE_PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const page = request.mode === 'navigate';
  const asset = url.pathname.startsWith(`${scope.pathname}assets/`);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (asset && cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type !== 'opaque') {
        try {
          await cache.put(request, response.clone());
          if (page) await cache.put(new URL('./', scope).href, response.clone());
        } catch {
          // A full or unavailable cache must not interrupt a successful load.
        }
      }
      return response;
    } catch {
      const fallback = cached || (page ? await cache.match(new URL('./', scope).href) : null);
      return fallback || Response.error();
    }
  })());
});
