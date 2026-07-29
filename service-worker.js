/* eslint-disable no-restricted-globals */
const CACHE_VERSION = 'aula-virtual-v1';
const CACHE_NAME = CACHE_VERSION;

// Usa rutas relativas (./) para evitar fallos por subdirectorios
const PRECACHE_URLS = [
  './',
  './index.html',
  './cursos.html',
  './detalle-curso.html',
  './enviar_tarea.html',
  './unidad1-1.html',
  './unidad1-2.html',
  './unidad1-3.html',
  './unidad1-4.html',
  './unidad2-1.html',
  './unidad2-2.html',
  './unidad2-3.html',
  './unidad2-4.html',
  './unidad3-1.html',
  ./unidad3-2.html',
  './unidad3-3.html',
  './unidad3-4.html',
  './unidad4-1.html',
  './unidad4-2.html',
  './unidad4-3.html',
  './unidad4-4.html',
  './unidad5-1.html',
  './unidad5-2.html',
  './unidad5-3.html',
  './unidad5-4.html',
  './unidad6-1.html',
  './unidad6-2.html',
  './unidad6-3.html',
  './unidad6-4.html',
  './unidad7-1.html',
  './unidad7-2.html',
  './unidad7-3.html',
  './unidad7-4.html',
  './manifest.json',
  './pwa-install.js',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/screenshot-desktop.png',
  './icons/screenshot-mobile.png'
];

// INSTALACIÓN SEGURO: Carga archivo por archivo sin romper la PWA
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalación iniciada');

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Cache abierto:', CACHE_NAME);
      
      // Intentar cachear uno a uno de forma tolerante a errores
      const cachePromises = PRECACHE_URLS.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          } else {
            console.warn(`[Service Worker] No se pudo cachear (${response.status}): ${url}`);
          }
        } catch (err) {
          console.warn(`[Service Worker] Fallo al pedir recurso: ${url}`, err);
        }
      });

      await Promise.all(cachePromises);
      console.log('[Service Worker] Precache finalizado');
      return self.skipWaiting();
    })
  );
});

// ACTIVACIÓN: Limpieza de cachés
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
        return null;
      });
    })
  );
});
