/*globals async, CacheTasks, importScripts, self */
"use strict";

// imports async(), CacheTasks
importScripts("js/lib/async.js");
importScripts("js/lib/cachetasks.js");
importScripts("js/mainSiteFiles.js");

const initTasks = [
  CacheTasks.deleteAllCaches(),
  // Save the site's skeleton.
  CacheTasks.populateCache("skeleton_cache", mainSiteFiles),
  //Add other tasks in this array...
];

const PageThumbTask = {
  storeSiteThumb: async(function* ({arrayBuffer, type, thumbURL}) {
    var thumbURL = new URL(thumbURL, self.location).href;
    var success = true;
    var isValidURL = thumbURL.startsWith(`${self.location.origin}/pagethumbs/`);
    // prevent thumbs trashing other URLs
    if(!isValidURL){
      success = false;
    }else{
      try {
        yield CacheTasks.saveBinaryToCache("thumbs_cache", arrayBuffer, type, thumbURL);
      } catch (err) {
        success = false;
      }
    }
    return success;
  }),
};

self.addEventListener("install", (ev) => {
  ev.waitUntil(Promise.all([initTasks]));
});

self.addEventListener("message", async(function* ({data, source}) {
  var result;
  var {name, id} = data;
  switch (name) {
  case "NewTab:PutSiteThumb":
    result = yield PageThumbTask.storeSiteThumb(data);
    break;
  case "NewTab:HasSiteThumb":
    result = yield CacheTasks.hasCacheEntry(data.thumbURL, "thumbs_cache");
    break;
  case "NewTab:DeleteSiteThumb":
    result = yield CacheTasks.deleteCacheEntry(data.thumbURL, "thumbs_cache");
    break;
  case "SW:InitializeSite":
    yield Promise.all(initTasks);
    result = true;
    break;
  case "SW:DeleteAllCaches":
    result = yield CacheTasks.deleteAllCaches();
    break;
  default:
    console.warn("Unhandled message", data.name);
  }
  // Only respond to messages that have an id, even if unhandeled.
  // This is to prevents locking any expecting promises.
  if (!id) {
    return;
  }
  source.postMessage({result, id});
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
