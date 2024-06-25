self.addEventListener('push', event => {
    const data = event.data.json();
    const { title, message } = data;

    event.waitUntil(
        self.registration.showNotification(title, {
            body: message,
            icon: '/icon.png'  // Add an icon for your notifications
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')  // Customize the URL to open on notification click
    );
});
