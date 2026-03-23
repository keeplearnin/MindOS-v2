// MindOS Service Worker — minimal, network-first
// Exists primarily for PWA installability. Data is always live from Supabase.
const CACHE_NAME = 'mindos-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
