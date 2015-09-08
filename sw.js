/*globals async, CacheTasks, importScripts, self */
"use strict";

// imports async(), CacheTasks
importScripts("js/lib/async.js", "js/lib/cachetasks.js");

const SKELETON_CACHE = "newtab-v2";
const THUMBS_CACHE = "thumbs-v1";

// The main files of remote new tab website.
const mainSiteFiles = [
  "./",
  "css/images/close.png",
  "css/images/controls.svg",
  "css/images/defaultFavicon.png",
  "css/images/search-arrow-go.svg",
  "css/images/search-indicator-magnifying-glass.svg",
  "css/images/shared-menu-check.svg",
  "css/images/whimsycorn.png",
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
  "js/rect.js",
  "js/sites.js",
  "js/transformations.js",
  "js/undo.js",
  "js/updater.js",
  "locale/newTab.js",
];

const PageThumbTask = {
  storeSiteThumb: async(function* ({arrayBuffer, type, thumbPath}) {
    var thumbURL = new URL(thumbPath, self.location);
    try {
      yield CacheTasks.saveBinaryToCache(THUMBS_CACHE, arrayBuffer, type, thumbURL);
    } catch (err) {
      console.warn("Could not store the URL!", err);
    }
    return thumbURL.href;
  }),
};

self.addEventListener("install", (ev) => {
  var installTasks = [
    CacheTasks.clearAllCaches(),
    // Save the site's skeleton.
    CacheTasks.populateCache(SKELETON_CACHE, mainSiteFiles),
    //Add other tasks in this array...
  ];
  ev.waitUntil(Promise.all([installTasks]));
});

self.addEventListener("message", async(function* ({data, source}) {
  switch (data.name) {
  case "NewTab:StoreSiteThumb":
    yield PageThumbTask.storeSiteThumb(data);
    break;
  case "NewTab:HasThumb":
    var result = yield CacheTasks.hasCacheEntry(data.thumbURL, THUMBS_CACHE);
    var responseData = Object.assign({
      name: "SW:HasThumb",
      result
    }, data);
    source.postMessage(responseData);
    break;
  default:
    console.warn("Unhandled message", data.name);
  }
}));

self.addEventListener("fetch", (ev) => {
  var key = getSwitchKeyFromURL(ev.request.url);
  switch (key) {
  case "pagethumbs":
    ev.respondWith(CacheTasks.respondFromCache(ev.request, THUMBS_CACHE));
    break;
  default:
    ev.respondWith(CacheTasks.respondFromCache(ev.request, SKELETON_CACHE));
  }
});

function getSwitchKeyFromURL(url) {
  // split and return the first path segment
  var key = new URL(url).pathname.split("/")[1];
  return key;
}
