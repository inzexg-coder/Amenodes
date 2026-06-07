const CACHE = 'amenodes-v1';
const ASSETS = [
  '/Amenodes/',
  '/Amenodes/amenodes.html',
  '/Amenodes/manifest.json',
  '/Amenodes/styles/main.css',
  '/Amenodes/src/main.js',
  '/Amenodes/icons/icon-192.png',
  '/Amenodes/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
