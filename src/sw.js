/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*jshint worker:true*/
/*globals async, CacheTasks, self, mainSiteURLs, Response */

"use strict";

importScripts("js/lib/async.js"); // imports async()
importScripts("js/lib/responseRequestUtils.js"); // imports RequestUtils, ResponseUtils
importScripts("js/lib/cachetasks.js"); // imports CacheTasks
importScripts("js/mainSiteURLs.js"); // imports mainSiteURLs

const PageThumbTasks = {
  /**
   * Ensure we always resolve with a Response, to avoid Content Corrupted errors
   * being shown to the user.
   *
   * @param {Promise<Response>} promise The promise that should resolve to a
   *                                    Response.
   */
  ensureResponse: async(function*(promise) {
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
    yield CacheTasks.populateCache(mainSiteURLs, "skeleton_cache");
  }),
};

self.addEventListener("install", (ev) => {
  ev.waitUntil(PageThumbTasks.init());
});

self.addEventListener("fetch", (ev) => {
  var key = getSwitchKeyFromURL(ev.request.url);
  var promise;
  switch (key) {
  case "pagethumbs":
    promise = CacheTasks.respondFromCache(ev.request, "thumbs_cache");
    ev.respondWith(PageThumbTasks.ensureResponse(promise));
    break;
  case "images":
    promise = CacheTasks.refreshCacheEntry(ev.request, "tiles_cache");
    ev.respondWith(PageThumbTasks.ensureResponse(promise));
    break;
  case "karma":
    ev.respondWith(fetch(request));
    break;
  default:
    promise = CacheTasks.refreshCacheEntry(ev.request, "skeleton_cache");
    ev.respondWith(promise);
  }
});

function getSwitchKeyFromURL(url) {
  //check if we are running in Karma
  if (self.location.port === "9876") {
    return "karma";
  }
  // split and return the first path segment
  var key = new URL(url).pathname.split("/")[1];
  return key;
}
