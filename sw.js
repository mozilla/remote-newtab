/*globals async, importScripts, self, caches*/
"use strict";
const CACHE_NAME = "newtab-v2";
importScripts("lib/async.js");
console.log("dsadfasdfs");

self.addEventListener("install", (ev) => {
  const urlsToCache = [
    "css/newTab.inc.css",
    "css/images/close.png",
    "css/images/controls.svg",
    "css/images/defaultFavicon.png",
    "css/images/search-arrow-go.svg",
    "css/images/search-indicator-magnifying-glass.svg",
    "css/images/shared-menu-check.svg",
    "css/images/whimsycorn.png",
    "js/lib/async.js",
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
    try {
      yield cache.addAll(urlsToCache);
    } catch (err) {
      console.log("Could not add a file", err);
    }
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
