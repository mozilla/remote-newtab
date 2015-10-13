/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
 /*globals gDrag, gNewTab, gGrid, gUndoDialog, async, swMessage, gPinnedLinks, gBlockedLinks*/

"use strict";

const DIRECTORY_LINKS_TYPE = "application/json";

// The const that tells where to obtain directory links
const PREF_DIRECTORY_SOURCE = "https://tiles.services.mozilla.com/v3/links/fetch/en-US/nightly";

/**
 * Emits notifications to PlacesProvider and Links
 */
const gDirectoryLinksProvider = {
  // download default interval is 24 hours in milliseconds
  _downloadIntervalMS: 86400000,

  // links download deferred, resolved upon download completion
  _downloadDeferred: null,

  _directoryLinksRequest: new Request(PREF_DIRECTORY_SOURCE),

  init: async(function* () {
    var self = gDirectoryLinksProvider;
    gDirectoryLinksProvider._lastDownloadMS = 0;
    var hasEntry = yield CacheTasks.hasCacheEntry(self._directoryLinksRequest, "directory_links");

    if (hasEntry) {
      var response = yield CacheTasks.respondFromCache(self._directoryLinksRequest, "directory_links");
      var txt = yield response.text();
      self._lastDownloadMS = JSON.parse(txt).timestamp;
    }
    yield gDirectoryLinksProvider._fetchAndCacheLinksIfNecessary();
  }),


  get _needsDownload () {
    // fail if last download occured less then 24 hours ago
    if ((Date.now() - this._lastDownloadMS) > this._downloadIntervalMS) {
      return true;
    }
    return false;
  },

  _fetchAndCacheLinksIfNecessary: async(function* (forceDownload = false) {
    if (gDirectoryLinksProvider._downloadDeferred) {
      // fetching links already - just return the promise
      return gDirectoryLinksProvider._downloadDeferred;
    }

    if (!forceDownload && !gDirectoryLinksProvider._needsDownload) {
      return Promise.resolve(); // download is not needed
    }

    gDirectoryLinksProvider._downloadDeferred =
      yield gDirectoryLinksProvider._fetchAndCacheLinks(PREF_DIRECTORY_SOURCE).then((response) => {
        gDirectoryLinksProvider._downloadDeferred = null;
        // TODO: notify observers of onManyLinksChanged
      }, () => {
        gDirectoryLinksProvider._downloadDeferred = null;
        // TODO: notify observers of onDownloadFail
      });
    return gDirectoryLinksProvider._downloadDeferred;
  }),

  _fetchAndCacheLinks(uri) {
    return new Promise((resolve, reject) => {
      // TODO: Add the locale and channel sent from msgs.
      //uri = uri.replace("%LOCALE%", this.locale);
      //uri = uri.replace("%CHANNEL%", UpdateUtils.UpdateChannel);

      var successHandler = function(response) {
        if (response.status && response.status !== 200) {
          json = "{}";
        }
        resolve(response);
      };
      var failHandler = function(e) {
        reject("Fetching " + uri + " results in error code: " + e.target.status);
      };
      CacheTasks.deleteCacheEntry(this._directoryLinksRequest, "directory_links");
      CacheTasks.respondFromCache(this._directoryLinksRequest, "directory_links", "store").then(successHandler, failHandler);
    });
  },
};
