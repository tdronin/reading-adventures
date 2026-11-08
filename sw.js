// Offline support. The page itself is network-first so updates show up right away;
// everything else is served from cache and refreshed in the background.
const CACHE = "reading-v2";
const CORE = ["./", "index.html", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isPage = e.request.mode === "navigate";
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request, isPage ? { cache: "no-store" } : {})
      .then(r => { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; })
      .catch(() => hit);
    return isPage ? net : (hit || net);
  }));
});
