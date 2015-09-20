/*globals async, CacheTasks, importScripts, self */
"use strict";

// imports async(), CacheTasks
importScripts("js/lib/async.js");
importScripts("js/lib/cachetasks.js");

// The main files of remote new tab website.
const mainSiteFiles = [
  "css/images/close.png",
  "css/images/controls.svg",
  "css/images/defaultFavicon.png",
  "css/images/search-arrow-go.svg",
  "css/images/search-indicator-magnifying-glass.svg",
  "css/images/shared-menu-check.svg",
  "css/images/whimsycorn.png",
  "css/newTab.css",
  "css/newTab.inc.css",
  "js/cells.js",
  "js/customize.js",
  "js/drag.js",
  "js/dragDataHelper.js",
  "js/drop.js",
  "js/dropPreview.js",
  "js/dropTargetShim.js",
  "js/grid.js",
  "js/lib/async.js",
  "js/newTab.js",
  "js/page.js",
  "js/rectangle.js",
  "js/sites.js",
  "js/transformations.js",
  "js/undo.js",
  "js/updater.js",
  "locale/newTab.js",
];

const PageThumbTask = {
  storeSiteThumb: async(function* ({arrayBuffer, type, thumbPath, cacheControl}) {
    var thumbURL = new URL(thumbPath, self.location);
    var success = true;
    try {
      var ops = {
        cacheName: "thumbs_cache",
        arrayBuffer,
        type,
        requestURL: thumbURL,
        cacheControl: cacheControl || [],
      };
      yield CacheTasks.saveBinaryToCache(ops);
    } catch (err) {
      success = false;
    }
    return success;
  }),
};

self.addEventListener("install", (ev) => {
  var installTasks = [
    CacheTasks.clearAllCaches(),
    // Save the site's skeleton.
    CacheTasks.populateCache("skeleton_cache", mainSiteFiles),
    //Add other tasks in this array...
  ];
  ev.waitUntil(Promise.all([installTasks]));
});

self.addEventListener("message", async(function* ({data, source}) {
  var result;
  switch (data.name) {
  case "NewTab:PutSiteThumb":
    result = yield PageThumbTask.storeSiteThumb(data);
    break;
  case "NewTab:HasSiteThumb":
    result = yield CacheTasks.hasCacheEntry(data.thumbURL, "thumbs_cache");
    break;
  case "NewTab:DeleteSiteThumb":
    result = yield CacheTasks.deleteCacheEntry(data.thumbURL, "thumbs_cache");
    break;
  case "deleteAllCaches": {
    result = yield CacheTasks.deleteAllCaches();
    break;
  }
  default:
    console.warn("Unhandled message", data.name);
    return; // don't post message a response
  }
  var responseData = Object.assign({result}, data);
  source.postMessage(responseData);
}));

self.addEventListener("fetch", (ev) => {
  var key = getSwitchKeyFromURL(ev.request.url);
  switch (key) {
  case "pagethumbs":
    ev.respondWith(CacheTasks.respondFromCache(ev.request, "thumbs_cache", "throw"));
    break;
  default:
    ev.respondWith(CacheTasks.respondFromCache(ev.request, "skeleton_cache"));
  }
});

function getSwitchKeyFromURL(url) {
  // split and return the first path segment
  var key = new URL(url).pathname.split("/")[1];
  return key;
}
