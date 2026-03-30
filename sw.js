var CACHE = 'dk3-v13';
var ASSETS = [
  '/dk3/',
  '/dk3/index.html',
  '/dk3/manifest.json',
  '/dk3/icon-192.png',
  '/dk3/icon-512.png'
];

// Install — cache all assets
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

// Activate — delete old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

// Fetch — cache first, then network
self.addEventListener('fetch', function(e){
  // Only handle same-origin requests
  if(e.request.url.indexOf(self.location.origin) !== 0) return;
  
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Cache successful GET requests
        if(e.request.method === 'GET' && response.status === 200){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function(){
        // Offline fallback — serve index.html
        return caches.match('/dk3/index.html');
      });
    })
  );
});

// Background sync message
self.addEventListener('message', function(e){
  if(e.data === 'skipWaiting') self.skipWaiting();
});
