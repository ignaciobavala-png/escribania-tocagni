// Service worker del panel. Mínimo a propósito: lo que hace instalable la app
// y muestra una pantalla propia sin conexión. NO cachea páginas ni respuestas
// de la API: son datos de clientes y no deben quedar en el teléfono.
const OFFLINE = '/admin/offline.html';
const CACHE = 'panel-offline-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)));
});
