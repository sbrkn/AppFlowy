// AppFlowy PWA Service Worker
// Handles caching, offline support, and background sync

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `appflowy-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `appflowy-dynamic-${CACHE_VERSION}`;
const API_CACHE = `appflowy-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/offline.html',
];

// ==========================================
// Install Event – cache static assets
// ==========================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ==========================================
// Activate Event – clean old caches
// ==========================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== STATIC_CACHE &&
                key !== DYNAMIC_CACHE &&
                key !== API_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ==========================================
// Fetch Event – route-based caching strategy
// ==========================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET') return;
  const ALLOWED_HOSTNAMES = ['googleapis.com', 'firebaseio.com'];
  const isSameOrigin = url.origin === self.location.origin;
  const isAllowedExternal = ALLOWED_HOSTNAMES.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  if (!isSameOrigin && !isAllowedExternal) {
    return;
  }

  // API routes – Network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Static assets – Cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation requests – Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then(
          (cached) => cached || new Response('Offline', { status: 503 })
        )
      )
    );
    return;
  }

  // Default – Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ==========================================
// Cache Strategies
// ==========================================

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, timeoutMs = 3000) {
  const cache = await caches.open(cacheName);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}

// ==========================================
// Background Sync
// ==========================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-documents') {
    event.waitUntil(syncPendingDocuments());
  }
});

async function syncPendingDocuments() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) =>
    client.postMessage({ type: 'SYNC_REQUESTED' })
  );
}

// ==========================================
// Push Notifications
// ==========================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New update in your workspace',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AppFlowy', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      })
  );
});

// ==========================================
// Message Handler (from app)
// ==========================================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
