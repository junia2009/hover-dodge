// The page registers sw.js?v=<VERSION>; a new version means a new script URL
// (so the worker updates) and a fresh cache name.
const CACHE = 'hoverdodge-v' + (new URL(self.location).searchParams.get('v') || 'dev');
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];
// 3D models are big and rarely change: they live in their own cache so a new
// game version doesn't re-download ~2 MB of glTF. Bump this name when a model changes.
const MODEL_CACHE = 'hoverdodge-models-v1';
const MODELS_PRECACHE = ['./models/ship.glb', './models/ray.glb', './models/pallas.glb', './models/styx.glb', './models/acheron.glb'];

self.addEventListener('install', e => {
  // 個別にキャッシュ — 1ファイル失敗しても他を止めない
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(
        PRECACHE.map(url =>
          fetch(new Request(url, { cache: 'reload' }))
            .then(res => res.ok ? cache.put(url, res) : null)
            .catch(() => null)
        )
      )
    ).then(() => caches.open(MODEL_CACHE)).then(mc =>
      Promise.all(MODELS_PRECACHE.map(url => mc.match(url).then(hit => hit || fetch(url)
        .then(res => res.ok ? mc.put(url, res) : null).catch(() => null))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== MODEL_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// network first (with a short timeout) → cache fallback; keeps the cache fresh
function networkFirst(req) {
  return caches.open(CACHE).then(cache => {
    const net = fetch(req, { cache: 'no-store' }).then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    });
    const timeout = new Promise(r => setTimeout(r, 4000));
    return Promise.race([net, timeout])
      .then(res => res || cache.match(req).then(hit => hit || net))
      .catch(() => cache.match(req));
  });
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // CDN (Three.js) / Google Fonts → cache-first, 初回ロード時に保存
  if (url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('unpkg.com') ||
      url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        // only keep good responses (opaque cross-origin font files report status 0)
        if (res.ok || res.type === 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
    return;
  }
  if (url.origin !== self.location.origin) return;

  // the page itself → always try the network first, so a new version shows on the next open
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(networkFirst(e.request));
    return;
  }
  // models → cache-first in their own long-lived cache
  if (url.pathname.includes('/models/')) {
    e.respondWith(caches.open(MODEL_CACHE).then(cache => cache.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }))));
    return;
  }
  // everything else → stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(hit => {
        const fresh = fetch(e.request).then(res => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => null);
        return hit || fresh;
      })
    )
  );
});
