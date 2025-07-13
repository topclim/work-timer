// service-worker.js

const CACHE_NAME = 'work-tracker-cache-v1';
const DATA_CACHE_NAME = 'work-tracker-data-cache-v1';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/assets/icon-144x144.png',

  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://apis.google.com/js/api.js'
];

// تثبيت الخدمة وتخزين الملفات
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تنشيط الخدمة وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// التعامل مع الطلبات
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// رسالة مزامنة في الخلفية (اختياري للتطوير المستقبلي)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-work-sessions') {
    event.waitUntil(syncWorkSessions());
  }
});

// مثال على مزامنة جلسات العمل (اختياري للتوسع)
async function syncWorkSessions() {
  const saved = await caches.open(DATA_CACHE_NAME);
  const data = await saved.match('/sessions');
  if (data) {
    const sessions = await data.json();
    console.log('Syncing sessions:', sessions);
    // أرسل إلى الخادم أو احفظ بأي طريقة تريدها
  }
}

// إشعارات الدفع (اختياري للتطوير المستقبلي)
self.addEventListener('push', function (event) {
  const data = event.data ? event.data.text() : '💼 وقت العمل الآن!';
  const options = {
    body: data,
    icon: '/assets/icon-192x192.png',
    badge: '/assets/icon-72x72.png'
  };

  event.waitUntil(
    self.registration.showNotification('📢 إشعار تتبع العمل', options)
  );
});

// حدث عند النقر على الإشعار
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/index.html')
  );
});

// استرجاع النسخة الأخيرة من الملفات في حال التحديث
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
