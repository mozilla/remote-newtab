/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*jshint worker:true*/
/*globals async, CacheTasks, Response, fetch */
"use strict";
importScripts("js/lib/async.js"); // imports async()
importScripts("js/lib/cachetasks.js"); // imports CacheTasks

const SWTasks = {
  /**
   * Initialization tasks for service workers.
   */
  init() {
    return async.task(function*() {
      yield CacheTasks.deleteCaches([
        "skeleton_cache", // The html, js, css, of site
        "pagethumbs_cache", // User's history tiles
        "ads_cache", // Advertisement tiles
      ]);
      var request = yield fetch("js/mainSiteURLs.json");
      var mainSiteURLs = (yield request.json())
        .map(path => `${location.origin}${path}`);
      yield CacheTasks.addAll(mainSiteURLs, "skeleton_cache");
    }, this);
  },
  /**
   * Selects the appropriate response to return.
   *
   * @param {Request} request The request that the client made.
   * @return {Promise<response>} The response to serve to the client.
   */
  selectResponse(request) {
    return async.task(function*() {
      var response;
      var key = new URL(request.url).pathname.split("/")[1];
      switch (key) {
      case "pagethumbs":
        response = yield CacheTasks.match(request, "pagethumbs_cache");
        // TODO: Ensure page thumb.
        break;
      case "images":
        response = yield CacheTasks.match(request, "ads_cache");
        // TODO: Ensure dynamic tile
        break;
      default:
        response = yield CacheTasks.match(request, "skeleton_cache");
      }
      if (!response && navigator.onLine) {
        console.warn(`Going to network for ${request.url}`);
        response = yield fetch(request);
        yield CacheTasks.put(request, response, "skeleton_cache");
      }
      return response || new Response();
    }, this);
  },
};

self.addEventListener("install", (ev) => {
  ev.waitUntil(SWTasks.init());
});

self.addEventListener("fetch", (ev) => {
  ev.respondWith(SWTasks.selectResponse(ev.request));
});
