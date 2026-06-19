// Service worker — required for PWA install + push notifications.
// Lives at: public/sw.js
const CACHE = "wc2026-v1";

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

// Network-first: always try live (so Vercel updates show instantly),
// fall back to nothing special — the app needs live data anyway.
self.addEventListener("fetch", (e) => {
  // let the browser handle everything normally; we don't cache app data
  return;
});

// Push notification received
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  const title = data.title || "World Cup 2026 League";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Tapping a notification opens the app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || "/"));
});
