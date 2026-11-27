/* Badam Sat service worker: keeps the app shell and libraries available for fast, installable launches. */
const V = "tashghar-v13";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const CDN = ["unpkg.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin && !CDN.includes(url.hostname)) return;
  if (req.mode === "navigate") {
    // network first so updates arrive, cache as the offline fallback
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(V).then(c=>c.put("./index.html", copy)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // stale-while-revalidate for everything else
  e.respondWith(caches.open(V).then(c => c.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(()=>hit);
    return hit || net;
  })));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window", includeUncontrolled:true}).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow("./")));
});
