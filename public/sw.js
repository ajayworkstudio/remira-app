/* Remira service worker
 * - Caches the app shell & static assets only (never Supabase/API responses)
 * - Offline fallback page
 * - Web Push: push + notificationclick
 */
const VERSION = "remira-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const IS_DEV = new URL(self.location.href).searchParams.has("dev");

const PRECACHE = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/badge-72.png",
  "/icons/apple-touch-icon.png",
];

// App routes whose HTML is a data-free shell (data loads client-side from Supabase)
const SHELL_ROUTES = ["/home", "/reminders", "/notes", "/calendar", "/profile", "/settings"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // never touch mutations
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase & other origins: straight to network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Hashed build assets & icons: cache-first
  if (!IS_DEV && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"))) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Page navigations: network-first, fall back to cached shell, then offline page
  if (req.mode === "navigate") {
    const isShell = SHELL_ROUTES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (!IS_DEV && isShell && res.ok && !res.redirected && res.type === "basic") {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((c) => c.put(url.pathname, copy));
          }
          return res;
        } catch {
          const cached = isShell ? await caches.match(url.pathname, { cacheName: PAGE_CACHE }) : undefined;
          return cached || (await caches.match("/offline")) || new Response("You are offline.", { status: 503 });
        }
      })(),
    );
  }
});

// ---------------------------------------------------------------- Web Push
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Remira";
  const options = {
    body: payload.body || "You have a reminder.",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
    data: { url: payload.url || "/home" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/home", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(target);
            } catch {
              /* cross-scope navigate can fail; focus is enough */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
