/* eslint-disable no-restricted-globals */
/**
 * Service Worker para Aula Virtual
 * Estrategia de caché: Precache durante la instalación + Cache First con fallback a red
 */

// Versión del caché - incrementar cuando se actualicen los archivos
const CACHE_VERSION = 'aula-virtual-v1';
const CACHE_NAME = CACHE_VERSION;

// Archivos a cachear durante la instalación (precache)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/cursos.html',
  '/detalle-curso.html',
  '/enviar_tarea.html',
  '/unidad1-1.html',
  '/unidad1-2.html',
  '/unidad1-3.html',
  '/unidad1-4.html',
  '/unidad2-1.html',
  '/unidad2-2.html',
  '/unidad2-3.html',
  '/unidad2-4.html',
  '/unidad3-1.html',
  '/unidad3-2.html',
  '/unidad3-3.html',
  '/unidad3-4.html',
  '/unidad4-1.html',
  '/unidad4-2.html',
  '/unidad4-3.html',
  '/unidad4-4.html',
  '/unidad5-1.html',
  '/unidad5-2.html',
  '/unidad5-3.html',
  '/unidad5-4.html',
  '/unidad6-1.html',
  '/unidad6-2.html',
  '/unidad6-3.html',
  '/unidad6-4.html',
  '/unidad7-1.html',
  '/unidad7-2.html',
  '/unidad7-3.html',
  '/unidad7-4.html',
  '/manifest.json',
  '/pwa-install.js',
  '/service-worker.js',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png',
  '/icons/screenshot-desktop.png',
  '/icons/screenshot-mobile.png'
];

// =============================================
// INSTALACIÓN: Precache de archivos estáticos
// =============================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalación iniciada');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache abierto:', CACHE_NAME);
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Todos los archivos han sido cacheados');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Error durante la instalación:', error);
      })
  );
});

// =============================================
// ACTIVACIÓN: Limpieza de cachés antiguos
// =============================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activación iniciada');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar cachés antiguos que no coincidan con la versión actual
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activación completada');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[Service Worker] Error durante la activación:', error);
      })
  );
});

// =============================================
// FETCH: Estrategia Cache First con fallback a red
// =============================================
self.addEventListener('fetch', (event) => {
  // Ignorar solicitudes que no sean GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar solicitudes de extensiones o URLs externas
  const url = event.request.url;
  if (!url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si está en caché, devolverlo inmediatamente
        if (cachedResponse) {
          console.log('[Service Worker] Sirviendo desde caché:', event.request.url);
          return cachedResponse;
        }

        // Si no está en caché, buscar en la red
        console.log('[Service Worker] Buscando en red:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Si la respuesta es válida, cachearla para uso futuro
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Si falla la red, servir página offline para navegaciones
            if (event.request.mode === 'navigate') {
              console.log('[Service Worker] Red fallida, sirviendo página offline');
              return caches.match('/index.html');
            }
            return null;
          });
      })
      .catch((error) => {
        console.error('[Service Worker] Error en fetch:', error);
        // Fallback final: servir index.html para navegaciones
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return null;
      })
  );
});

// =============================================
// MENSAJES: Para comunicación con la app
// =============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// =============================================
// SYNC: Para sincronización en segundo plano
// =============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[Service Worker] Sincronización en segundo plano');
  }
});

// =============================================
// PUSH: Para notificaciones push
// =============================================
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'Nueva actualización en Aula Virtual',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: data.tag || 'aula-virtual-notification',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Aula Virtual', options)
  );
});

// =============================================
// NOTIFICATION CLICK: Manejar clics en notificaciones
// =============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});