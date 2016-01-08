// I am a service worker for the remote newtab page.
"use strict";

// NOTE: To invalidate cached resources, change the version number below.
const VERSION = "1";
const CACHE_NAME = "remote-newtab-v" + VERSION;

self.addEventListener("install", function (event) {
  let resourcesToCache = ["./"];

  event.waitUntil(
    // Fetch the list of resources to cache.
    fetch("./mainSiteURLs.json")
      .then(function(response){
        return response.json();
      }).then(function(data) {
        resourcesToCache = resourcesToCache.concat(data);
        caches.open(CACHE_NAME).then(function (cache) {
          console.log(resourcesToCache);
          return cache.addAll(resourcesToCache);
        })
      })
  );
});

function networkFirst(evt) {
  // Current browser implementations require waitUntil() to be called
  // synchronously during the event dispatch.  In the future we should
  // be able to move the evt.waitUntil() down to directly where we
  // need it in the respondWith() async handling.
  let waitUntilResolve;
  evt.waitUntil(new Promise(function(resolve) {
    waitUntilResolve = resolve;
  }));

  let cache;
  evt.respondWith(caches.open(CACHE_NAME).then(function(c) {
    cache = c;
    return fetch(evt.request);
  }).then(function(response) {
    waitUntilResolve(cache.put(evt.request, response.clone()));
    return response;
  }).catch(function(e) {
    return cache.match(evt.request);
  }).then(function(response) {
    // Always resolve the waitUntil promise. This is a no-op if we already
    // resolved the promise with cache.put() above.
    waitUntilResolve();
    // Final fallback if we are offline and cached content isn't available.
    return response || new Response("Offline and content unavailable.");
  }));
}

addEventListener("fetch", function(evt) {
  // TODO: Here we can skip any resources we don't want to cache.
  // let skip = false;
  // if (skip) {
  //   return;
  // }

  // We check the network before the cache for a few reasons:
  // * cache.addAll() will cache 404s, 500s, etc
  // * for cross origin resources without CORS, we dont know the response code
  // * the network has it's own HTTP caching that kicks in anyway
  networkFirst(evt);
});

self.addEventListener("activate", function (event) {
  // Claim the client that registered this service worker
  event.waitUntil(self.clients.claim());

  // Do some cache management. Remove caches no longer used.
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
