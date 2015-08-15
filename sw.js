/*globals async, importScripts, self, caches*/
"use strict";
const CACHE_NAME = "newtab-v2";
importScripts("async.js");

self.addEventListener("install", (ev) => {
  const urlsToCache = [
    "css/newTab.inc.css",
    "js/async.js",
    "js/cells.js",
    "js/customize.js",
    "js/drag.js",
    "js/dragDataHelper.js",
    "js/drop.js",
    "js/dropPreview.js",
    "js/dropTargetShim.js",
    "js/grid.js",
    "js/newTab.js",
    "js/page.js",
    "js/rect.js",
    "js/sites.js",
    "js/transformations.js",
    "js/undo.js",
    "js/updater.js",
    "locale/newTab.js",
    "newTab.html"
  ];
  var populateCacheTask = async(function*() {
    var cache = yield caches.open(CACHE_NAME);
    cache.addAll(urlsToCache);
  });
  ev.waitUntil(populateCacheTask());
});

self.addEventListener("fetch", (ev) => {
  var lookInCacheTask = async(function*() {
    var response = yield caches.match(ev.request);
    return response || fetch(ev.request);
  });
  ev.respondWith(lookInCacheTask());
});
