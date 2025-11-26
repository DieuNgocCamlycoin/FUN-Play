// Custom service worker for push notifications
self.addEventListener('push', function(event) {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'FUN PLAY - Nhận tiền!';
  const options = {
    body: data.body || 'Bạn vừa nhận được tiền!',
    icon: '/images/camly-coin.png',
    badge: '/images/camly-coin.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'crypto-payment',
    requireInteraction: true,
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'Xem ngay',
        icon: '/images/camly-coin.png'
      },
      {
        action: 'close',
        title: 'Đóng'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/wallet')
    );
  }
});

// Listen for messages from the main app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CRYPTO_RECEIVED') {
    const { amount, token } = event.data;
    
    self.registration.showNotification('💰 FUN PLAY - RICH!', {
      body: `Bạn vừa nhận được ${amount} ${token}! 🎉`,
      icon: '/images/camly-coin.png',
      badge: '/images/camly-coin.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'crypto-payment',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Xem ngay'
        }
      ]
    });
  }
});
