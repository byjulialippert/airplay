// Bei JEDER Änderung an lib/, model/ oder anderen Dateien die Zahl hochzählen
// (v2 -> v3 -> v4 ...), damit der Browser die neuen Dateien holt.
const CACHE_NAME = 'atem-vis-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './CardoneTrial-ThinItalic.otf',
  './lib/p5.min.js',
  './lib/hydra-synth1.js',
  './lib/ml5.min.js',
  './model/model.json',        // Teachable-Machine-Dateien
  './model/metadata.json',
  './model/weights.bin',
  './icon-192.png',
  './icon-512.png'
];

// Installation: alle Dateien einzeln cachen.
// Fehlt eine Datei, bricht die Installation NICHT mehr ab, stattdessen
// steht in der Konsole "Nicht gecacht" mit dem Dateinamen.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('Nicht gecacht (Datei fehlt?):', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Aktivierung: alte Caches aufräumen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Abrufen von Dateien
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Nur normale Abrufe von der eigenen Seite behandeln
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Die Seite selbst (index.html, auch mit ?mode=mic):
  // erst das Netzwerk versuchen (damit Änderungen sofort sichtbar sind),
  // ohne Internet die gespeicherte Version nehmen.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Alles andere (Bibliotheken, Modell, Schrift, Icons): aus dem Cache,
  // und nur wenn es dort fehlt, aus dem Netzwerk.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request);
    })
  );
});