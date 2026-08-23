/* Service Worker بسيط — يسمح بتثبيت النظام كتطبيق على الجوال (PWA)
   ويخزّن الصفحة الرئيسية والأيقونات مؤقتًا عشان تفتح بسرعة حتى مع ضعف الاتصال.
   لا يخزّن أي بيانات فعلية من Firestore — البيانات الحقيقية دايمًا لازم اتصال إنترنت. */

const CACHE_NAME = "hr-system-shell-v1";
const APP_SHELL = [
  "./manifest.json",
  "./favicon-32.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* شبكة أولاً مع رجوع للنسخة المخزّنة عند فشل الاتصال — عشان البيانات دايمًا تكون محدّثة لما يكون فيه إنترنت */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; /* لا نتدخل في طلبات Firestore/الخدمات الخارجية */

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
