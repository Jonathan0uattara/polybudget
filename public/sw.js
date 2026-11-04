// Service worker PolyBudget : rend l'app installable et utilisable hors ligne.
const CACHE = "polybudget-v2";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Ne jamais intercepter Firebase (authentification et base de données).
  if (/googleapis\.com|firebaseapp\.com|firebaseio\.com|google\.com/.test(url.hostname) && !/fonts\./.test(url.hostname)) return;
  // Réseau d'abord, cache en secours.
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(url.hostname))) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match(self.registration.scope)))
  );
});
