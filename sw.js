/* Service Worker — app do aluno
   Guarda a "casca" do app para abrir mesmo sem internet.
   Dados nunca são cacheados: sempre vêm frescos do Supabase. */
const CACHE = 'meutreino-v2';
const CASCA = ['app.html', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // nunca cachear chamadas ao banco nem ao CDN de scripts
  if (url.includes('supabase.co') || url.includes('cdn.jsdelivr') || e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
        return resp;
      })
      .catch(() => caches.match(e.request))   // offline: serve do cache
  );
});
