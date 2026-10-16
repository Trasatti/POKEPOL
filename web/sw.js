// Cache offline do PokéPol: rede primeiro para os arquivos do jogo, cache como reserva.
const CACHE = 'pokepol-v2';
const CORE = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icon.svg',
  'js/data.js', 'js/rules.js', 'js/art.js', 'js/map.js', 'js/game.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request))
  );
});
