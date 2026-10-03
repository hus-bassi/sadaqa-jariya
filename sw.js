/**
 * ============================================================
 *  Service Worker — صدقة جارية
 * ============================================================
 *  يخزّن واجهة الموقع وملفاته فقط.
 *  ⚠️ لا يخزّن الصوت ولا نصوص القرآن (حقوق النشر / التوزيع).
 * ============================================================
 */
const VERSION = 'v1.1.0';
const CACHE = `sadaqa-cache-${VERSION}`;

/* أصول التطبيق الأساسية فقط */
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/main.css',
  './assets/js/main.js',
  './assets/js/config.js',
  './assets/js/site.config.js',
  './assets/js/utils.js',
  './assets/js/audio.js',
  './assets/js/icons.js',
  './assets/js/duas.js',
  './assets/js/counters.js',
  './assets/js/quran.js',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // لا نتدخل في الصوت ولا في نصوص القرآن ولا في التحليلات
  if (
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.m4a') ||
    url.pathname.endsWith('.ogg') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // التنقل: الشبكة أولًا مع بديل من الكاش
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // الأصول الثابتة: الكاش أولًا
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
  }
});
