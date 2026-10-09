// CRESCIVE Production Firebase Cloud Messaging Service Worker
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

// Initialize Firebase inside the service worker
const firebaseConfig = {
  projectId: "gen-lang-client-0208031043",
  appId: "1:572071731074:web:dec3d3e1f28a14fcbbb99b",
  apiKey: "AIzaSyBS9eN0eImmjjLs1aWYuZlqPloKADgF-9E",
  authDomain: "gen-lang-client-0208031043.firebaseapp.com",
  storageBucket: "gen-lang-client-0208031043.firebasestorage.app",
  messagingSenderId: "572071731074",
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (err) {
  console.warn("FCM messaging initialization inside service worker:", err);
}

// Background push notification handler
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw] Received background message: ", payload);

    const data = payload.data || {};
    const notification = payload.notification || {};

    const title = notification.title || data.title || "CRESCIVE";
    const body = notification.body || data.body || "New update in CRESCIVE";
    const icon = notification.icon || data.icon || "/crescive_logo.png";
    const tag = data.tag || (data.type ? `crescive-${data.type}` : "crescive-notification");

    const notificationOptions = {
      body: body,
      icon: icon,
      badge: "/crescive_logo.png",
      tag: tag,
      renotify: true,
      data: {
        url: data.url || "/",
        type: data.type || "general",
        conversationId: data.conversationId,
        senderId: data.senderId,
        moveId: data.moveId,
        timestamp: Date.now(),
      },
      vibrate: [200, 100, 200],
    };

    return self.registration.showNotification(title, notificationOptions);
  });
}

// Handle notification tap / click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || "/";

  // Construct target URL based on notification type
  if (data.type === "chat" && data.conversationId) {
    targetUrl = `/?tab=chat&convo=${encodeURIComponent(data.conversationId)}`;
    if (data.senderId) {
      targetUrl += `&sender=${encodeURIComponent(data.senderId)}`;
    }
  } else if (data.type === "move_reminder") {
    targetUrl = "/?tab=moves";
    if (data.moveId) {
      targetUrl += `&moveId=${encodeURIComponent(data.moveId)}`;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, navigate and focus it
      for (const client of windowClients) {
        if ("focus" in client) {
          if ("navigate" in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Self-install and skip waiting to activate immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
