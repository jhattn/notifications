self.addEventListener('push', event => {
    const textData = event.data.text();
    console.log('Raw push event data:', textData);

    try {
        const data = JSON.parse(textData);
        console.log('Parsed push event data:', data);
        self.registration.showNotification(data.title, {
            body: data.message,
            icon: '/push.png' // Customize this path to your notification icon
        });
    } catch (e) {
        console.error('Error parsing push event data:', e);
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/') // Customize this URL to where you want to direct the user
    );
});
