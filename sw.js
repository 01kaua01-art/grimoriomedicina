/* Service worker: deixa o MedRPG instalável e jogável offline (quando servido via http/https).
 * Estratégia: rede primeiro (pega atualizações), cache como reserva. */
const CACHE = 'medrpg-v3.2.0';
const ASSETS = [
  './', './index.html', './css/style.css', './css/legal.css', './privacidade.html', './termos.html', './manifest.webmanifest', './assets/icon.svg',
  './js/config.js', './js/vendor/supabase.js', './js/cloud.js', './js/views/account.js', './js/views/ranking.js',
  './js/icons.js', './js/data.js', './js/store.js', './js/engine.js', './js/audio.js', './js/fx.js', './js/ui.js',
  './js/views/battle.js', './js/views/focus.js', './js/views/results.js', './js/views/hero.js', './js/views/arsenal.js',
  './js/views/collection.js', './js/views/chronicle.js', './js/views/stats.js', './js/views/settings.js', './js/dev.js', './js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Só o próprio site e as fontes passam pelo cache. Supabase (login, saves, ranking) vai direto à rede.
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }) // sempre revalida: evita servir versão antiga após um deploy
      .then((res) => {
        if (res.ok && (new URL(e.request.url).origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(e.request.url))) {
          const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || Response.error()))
  );
});
