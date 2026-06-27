// Service worker mínimo: solo lo necesario para que el navegador
// considere esta app como "instalable" (PWA). No cachea agresivamente
// para evitar que los clientes vean versiones viejas de la app.

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Deja pasar todas las peticiones directo a la red (sin caché propio).
  event.respondWith(fetch(event.request))
})
