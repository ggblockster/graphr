const CACHE_NAME = "graphr-v0.1";

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/assets/css/index.css",
    "/assets/js/app.js",
    "/manifest.json",
    "/assets/img/ic192.png",
    "/assets/img/ic512.png",
    "/assets/img/icon.ico",
    "/assets/img/icon.svg",
    "/assets/Phosphor.woff2"
];

const CDN_HOSTS = ["cdn.jsdelivr.net", "ajax.googleapis.com"]

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin && !CDN_HOSTS.includes(url.hostname)) return;

    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.status === 200) {
                    const copy = response.clone();
                    event.waitUntil(
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
                    );
                }
                return response;
            })
            .catch(async () => {
                const isNav = request.mode === "navigate";
                const cached = await caches.match(request, { ignoreSearch: isNav });
                if (cached) return cached;
                return isNav
                    ? (await caches.match("/index.html")) || Response.error()
                    : Response.error();
            })
    );
});