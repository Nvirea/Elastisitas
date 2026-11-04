// Service Worker Virtual Lab Elastisitas
// Naikkan versi cache setiap kali ada rilis baru.
const CACHE_NAME = "virtual-lab-elastisitas-v5";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./login.html",
    "./materi.html",
    "./simulasi.html",
    "./pengamatan.html",
    "./grafik.html",
    "./lkpd.html",
    "./evaluasi.html",
    "./css/style.css",
    "./js/auth.js",
    "./js/app.js",
    "./js/simulasi.js",
    "./js/pengamatan.js",
    "./js/grafik.js",
    "./js/lkpd.js",
    "./js/evaluasi.js",
    "./vendor/chart.umd.js",
    "./icons/favicon.svg",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// Network-first untuk file situs sendiri (selalu terbaru setelah deploy),
// cache sebagai cadangan saat offline.
self.addEventListener("fetch", event => {
    const req = event.request;
    if (req.method !== "GET") return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(req)
            .then(res => {
                if (res.ok && res.type === "basic") {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, copy));
                }
                return res;
            })
            .catch(() =>
                caches.match(req, { ignoreSearch: true }).then(hit =>
                    hit || (req.mode === "navigate" ? caches.match("./login.html") : undefined)
                )
            )
    );
});
