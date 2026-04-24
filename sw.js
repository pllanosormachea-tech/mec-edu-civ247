/* ============================================================
   Maquinaria y Equipo de Construcción — Service Worker
   Estrategia: Cache-first para assets, network-first para HTML
   ============================================================ */
const CACHE = 'mec-edu-v1';
const STATIC = [
  '/',
  '/index.html',
  '/estudiante/dashboard.html',
  '/docente/dashboard.html',
  '/auth/login.html',
  '/auth/registro.html',
  '/assets/css/styles.css',
  '/assets/css/dashboard.css',
  '/assets/js/main.js',
  '/assets/js/dashboard.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700;800&family=JetBrains+Mono:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
];

/* Instalar y cachear assets estáticos */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(STATIC.map(url => c.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

/* Limpiar caches viejos */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch: cache-first para CSS/JS/fuentes, network-first para HTML */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Solo interceptar GET */
  if (e.request.method !== 'GET') return;

  /* Network-first para HTML (siempre fresco) */
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  /* Cache-first para assets estáticos */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    })
  );
});
