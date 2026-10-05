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
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

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

  // 同一オリジン → stale-while-revalidate
  if (url.origin === self.location.origin) {
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
  }
});
