/// <reference lib="webworker" />

// ─────────────────────────────────────────────────────────
// WC26 Predictions — Service Worker
// ─────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Push Notifications ──────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: {
      url: data.url || "/",
    },
    vibrate: [100, 50, 100],
    actions: [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "WC26 Predictions", options)
  );
});

// ── Notification Click ──────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing window if available
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(targetUrl);
      })
  );
});
