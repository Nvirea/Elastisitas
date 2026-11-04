
const CACHE_NAME = "virtual-lab-elastisitas-v4";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./simulasi.html",
    "./pengamatan.html",
    "./materi.html",
    "./evaluasi.html",
    "./login.html",
    "./js/auth.js",
    "./js/evaluasi.js",
    "./css/style.css",
    "./js/app.js",
    "./js/simulasi.js",
    "./js/pengamatan.js",
    "./manifest.json"
];

// Install Service Worker
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );

    self.skipWaiting();
});

// Activate dan hapus cache versi lama
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

// Strategi pengambilan file
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Halaman HTML: utamakan versi terbaru dari server
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, copy);
                    });

                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );

        return;
    }

    // File pendukung: gunakan cache jika tersedia
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                return cached || fetch(event.request);
            })
    );
});
