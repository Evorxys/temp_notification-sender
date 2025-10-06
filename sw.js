const CACHE_NAME = 'pwa-cache-v2';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/static/style.css',
  'https://cdn-icons-png.flaticon.com/512/1827/1827370.png'
];

// Install and cache everything (including the app shell)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        try {
          // Try to fetch index.html and add to cache
          const response = await fetch('/');
          await cache.put('/', response.clone());
        } catch (err) {
          console.warn('⚠️ Could not fetch index.html during install.');
        }

        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  console.log('✅ Service Worker activated and cache updated.');
});

// Intercept network requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Serve cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }
      // Otherwise, fetch and cache dynamically
      return fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Fallback to cached homepage if offline
          return caches.match('/');
        });
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
