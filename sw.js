/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*globals async, CacheTasks, importScripts, self, mainSiteURLs, Response */

"use strict";

importScripts("js/lib/async.js"); // imports async()
importScripts("js/lib/cachetasks.js"); // imports CacheTasks
importScripts("js/mainSiteURLs.js"); // imports mainSiteURLs
importScripts("js/directoryLinksProvider.js");

const PageThumbTasks = {
  storeSiteThumb: async(function* ({arrayBuffer, type, thumbURL}) {
    var url = new URL(thumbURL, self.location).href;
    var success = true;
    var isValidURL = url.startsWith(`${self.location.origin}/pagethumbs/`);
    // prevent thumbs trashing other URLs
    if (!isValidURL) {
      success = false;
    }else {
      try {
        yield CacheTasks.saveBinaryToCache("thumbs_cache", arrayBuffer, type, url);
      } catch (err) {
        success = false;
      }
    }
    return success;
  }),
  /**
   * Ensure we always resolve with a Response, to avoid Content Corrupted errors
   * being shown to the user.
   *
   * @param {Promise<Response>} promise The promise that should resolve to a
   *                                    Response.
   */
  ensureResponse: async(function* (promise) {
    var response;
    try {
      response = yield promise;
    }catch (err) {
      console.error(err);
      response = new Response();
    }
    return response;
  }),
  init: async(function*() {
    yield CacheTasks.deleteAllCaches();
    yield CacheTasks.populateCache("skeleton_cache", mainSiteURLs);
  }),
};

self.addEventListener("install", (ev) => {
  ev.waitUntil(PageThumbTasks.init());
});

self.addEventListener("message", async(function* ({data, source}) {
  var result;
  var {name, id} = data;
  switch (name) {
  case "NewTab:PutSiteThumb":
    result = yield PageThumbTasks.storeSiteThumb(data);
    break;
  case "NewTab:HasSiteThumb":
    result = yield CacheTasks.hasCacheEntry(data.thumbURL, "thumbs_cache");
    break;
  case "NewTab:DeleteSiteThumb":
    result = yield CacheTasks.deleteCacheEntry(data.thumbURL, "thumbs_cache");
    break;
  case "NewTab:InitDirectoryLinksProvider":
    yield gDirectoryLinksProvider.init();
    result = true;
    break;
  case "SW:InitializeSite":
    yield PageThumbTasks.init();
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
  var promise;
  switch (key) {
  case "pagethumbs":
    promise = CacheTasks.respondFromCache(ev.request, "thumbs_cache", "throw");
    ev.respondWith(PageThumbTasks.ensureResponse(promise));
    break;
  case "images":
    promise = CacheTasks.respondFromCache(ev.request, "tiles_cache", "store");
    ev.respondWith(PageThumbTasks.ensureResponse(promise));
    break;
  default:
    promise = CacheTasks.respondFromCache(ev.request, "skeleton_cache", "store");
    ev.respondWith(promise);
  }
});

function getSwitchKeyFromURL(url) {
  // split and return the first path segment
  var key = new URL(url).pathname.split("/")[1];
  return key;
}
