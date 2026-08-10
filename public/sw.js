/// <reference lib="webworker" />

const CACHE_NAME = 'lifeos-v1';
const OFFLINE_URL = '/offline.html';

// Skip waiting and claim clients immediately on activation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip non-same-origin requests
  if (url.origin !== location.origin) return;

  // Never cache auth-redirect responses or /login
  if (url.pathname === '/login' || url.pathname.startsWith('/api/auth')) return;

  // /api/* — network only (lets the sync engine detect offline)
  if (url.pathname.startsWith('/api/')) return;

  // /_next/static/* — cache-first (immutable, hashed)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // RSC payload GETs (Next.js client-side nav) — network-first, cache fallback
  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigations — network-first, cached HTML fallback, then /offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Everything else — network first, cache on success
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Don't cache logged-out redirects or error responses
    if (
      response.ok &&
      !response.redirected &&
      !response.url.includes('/login')
    ) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error('Network unavailable and no cache');
  }
}

// Background sync flush handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-outbox') {
    event.waitUntil(flushOutbox());
  }
});

async function flushOutbox() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (clients.length > 0) {
    // A page is open — let the engine drain the outbox so it can reconcile
    // conflicts (adopt canonical record, toast) and advance the watermark.
    clients.forEach((client) => client.postMessage({ type: 'FLUSH_OUTBOX' }));
    return;
  }
  await flushOutboxInSW();
}

const OUTBOX_STORE = 'outbox';
const OUTBOX_CHUNK = 50;

function openLifeosDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('lifeos-sync', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllOutbox(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(OUTBOX_STORE, 'readonly').objectStore(OUTBOX_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function deleteOutboxOps(db, ids) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    for (const id of ids) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Drain the outbox with no page open. Each op is POSTed once; only applied and
// duplicate ops are dropped. Conflict/error ops stay queued so the main thread
// reconciles them (adopt canonical record, toast) on next open.
async function flushOutboxInSW() {
  let db;
  try {
    db = await openLifeosDB();
  } catch {
    return;
  }
  const ops = await getAllOutbox(db);
  for (let i = 0; i < ops.length; i += OUTBOX_CHUNK) {
    const chunk = ops.slice(i, i + OUTBOX_CHUNK);
    let res;
    try {
      res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ops: chunk }),
      });
    } catch {
      return; // retry on the next background sync event
    }
    if (!res.ok) return; // 401 (dead session) or server error — retry later
    const data = await res.json();
    const appliedIds = [];
    for (let j = 0; j < data.results.length; j++) {
      const status = data.results[j] && data.results[j].status;
      if (status === 'applied' || status === 'duplicate') appliedIds.push(chunk[j].opId);
    }
    if (appliedIds.length > 0) await deleteOutboxOps(db, appliedIds);
  }
}
