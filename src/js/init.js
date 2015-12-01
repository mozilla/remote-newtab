/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
(function() {
  "use strict";
  const Tasks = {
    registerServiceWorker() {
      return async.task(function*() {
        try {
          yield navigator.serviceWorker.register("../sw.js", {
            scope: "./"
          });
        } catch (err) {
          console.error("ServiceWorker registration failed:", err);
        }
      },this);
    },
    initializeNewTabPage() {
      return async.task(function*() {
        yield gUserDatabase.init();
        yield gNewTab.init();
        document.addEventListener("NewTabCommandReady", async(function*() {
          yield gPinnedLinks.init();
          yield gBlockedLinks.init();
        }));
      }, this);
    },
    addIndexToCache() {
      return async.task(function*() {
        yield CacheTasks.update(window.location.href, "skeleton_cache");
      }, this);
    }
  };
  document.addEventListener("DOMContentLoaded", async(function*() {
    yield Tasks.registerServiceWorker();
    yield Tasks.initializeNewTabPage();
    yield Tasks.addIndexToCache();
  }));
}());
