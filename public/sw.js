const CACHE_NAME = 'enerpetrol-v1'

const ASSETS_ESTATICOS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Instalar: cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_ESTATICOS))
  )
  self.skipWaiting()
})

// Activar: limpiar cachés viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: estrategia mixta
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Supabase y APIs siempre en red
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('vercel.app') ||
    event.request.method !== 'GET'
  ) {
    event.respondWith(fetch(event.request))
    return
  }

  // Assets estáticos: caché primero, luego red
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        // Solo cachear respuestas válidas
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})
