self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ includeUncontrolled: true });
      const appClient = allClients.find((client) => client.visibilityState === 'visible');
      if (appClient) {
        appClient.focus();
      } else if (allClients[0]) {
        allClients[0].focus();
      } else {
        self.clients.openWindow('./');
      }
    })(),
  );
});
