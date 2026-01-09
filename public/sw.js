// Custom service worker for push notifications and offline video caching
// VERSION 2 - Network First for HTML to prevent stale pages
const CACHE_VERSION = 'v2';
const CACHE_NAME = 'funplay-' + CACHE_VERSION;
const VIDEO_CACHE_NAME = 'funplay-videos-' + CACHE_VERSION;
const STATIC_CACHE_NAME = 'funplay-static-' + CACHE_VERSION;

// Static assets to cache - KHÔNG bao gồm HTML để luôn lấy bản mới
const STATIC_ASSETS = [
  '/images/camly-coin.png',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing new version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('[SW] Static cache failed:', err);
      });
    })
  );
  // Force activate immediately
  self.skipWaiting();
});

// Activate event - clean up ALL old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating new version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Xóa TẤT CẢ cache không phải version hiện tại
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  return self.clients.claim();
});

// Check if request is for HTML document
function isHtmlRequest(request) {
  const url = new URL(request.url);
  return request.destination === 'document' || 
         request.mode === 'navigate' ||
         url.pathname === '/' ||
         url.pathname.endsWith('.html');
}

// Fetch event - serve from cache or network
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // HTML/Navigation: LUÔN lấy từ network trước (Network First)
  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          console.log('[SW] Fetched fresh HTML from network');
          return response;
        })
        .catch(function() {
          console.log('[SW] Network failed, trying cache for HTML');
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle video requests specially
  if (isVideoRequest(event.request)) {
    event.respondWith(handleVideoRequest(event.request));
    return;
  }
  
  // Handle image requests
  if (isImageRequest(event.request)) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // For other requests, try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Cache successful responses (except HTML)
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});

// Check if request is for video
function isVideoRequest(request) {
  const url = new URL(request.url);
  return request.destination === 'video' || 
         url.pathname.endsWith('.mp4') || 
         url.pathname.endsWith('.webm') ||
         url.pathname.includes('/video/') ||
         request.headers.get('accept')?.includes('video/');
}

// Check if request is for image
function isImageRequest(request) {
  return request.destination === 'image' ||
         request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

// Handle video requests with caching
async function handleVideoRequest(request) {
  const cache = await caches.open(VIDEO_CACHE_NAME);
  
  // Try cache first for videos (they're large, prefer cached version)
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('[SW] Serving video from cache:', request.url);
    // Refresh cache in background
    refreshVideoCache(request, cache);
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Cache the video response
    if (networkResponse.status === 200) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      
      // Check video size before caching (limit to 50MB per video)
      const contentLength = networkResponse.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 50 * 1024 * 1024) {
        cache.put(request, responseToCache);
        console.log('[SW] Cached video:', request.url);
        
        // Notify app that video is cached
        notifyVideosCached([request.url]);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Video fetch failed:', request.url, error);
    // Return cached version if available, otherwise throw
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Refresh video cache in background
async function refreshVideoCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse);
    }
  } catch (e) {
    // Silently fail background refresh
  }
}

// Handle image requests with caching
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder for failed images
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="#1a1a2e" width="100" height="100"/><text fill="#888" x="50" y="50" text-anchor="middle" dy=".3em" font-size="12">Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Notify clients about cached videos
function notifyVideosCached(videoUrls) {
  self.clients.matchAll().then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage({
        type: 'VIDEOS_CACHED',
        urls: videoUrls
      });
    });
  });
}

// Listen for messages from the main app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CACHE_VIDEO') {
    const { videoUrl } = event.data;
    
    caches.open(VIDEO_CACHE_NAME).then(function(cache) {
      fetch(videoUrl).then(function(response) {
        if (response.status === 200) {
          cache.put(videoUrl, response);
          console.log('[SW] Manually cached video:', videoUrl);
          notifyVideosCached([videoUrl]);
        }
      }).catch(function(err) {
        console.log('[SW] Failed to cache video:', err);
      });
    });
  }
  
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
  
  if (event.data && event.data.type === 'GET_CACHED_VIDEOS') {
    getCachedVideos().then(function(urls) {
      event.source.postMessage({
        type: 'CACHED_VIDEOS_LIST',
        urls: urls
      });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_VIDEO_CACHE') {
    caches.delete(VIDEO_CACHE_NAME).then(function() {
      console.log('[SW] Video cache cleared');
      event.source.postMessage({
        type: 'VIDEO_CACHE_CLEARED'
      });
    });
  }
});

// Get list of cached video URLs
async function getCachedVideos() {
  try {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    const requests = await cache.keys();
    return requests.map(r => r.url);
  } catch (e) {
    return [];
  }
}

// Push notification handler
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
