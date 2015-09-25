/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* globals gPinnedLinks, gUserDatabase, async*/
"use strict";

/**
 * Singleton that keeps track of all blocked links in the grid.
 */
(function(exports) {
  const gBlockedLinks = {
    /**
     * The cached list of blocked links.
     */
    _links: {},


    /**
     * Load the blocked links from gUserDatabase and cache them.
     */
    initBlockedLinks() {
      var loadPromise = gUserDatabase.load("prefs", "blockedLinks");
      loadPromise.then(loadedLinks => {
        this._links = (loadedLinks && loadedLinks.length) ? JSON.parse(loadedLinks) : {};
      });
      return loadPromise;
    },

    /**
     * The list of blocked links.
     */
    get links() {
      return this._links;
    },

    _hash(url) {
      var buffer = new TextEncoder("utf-8").encode(url);
      return window.crypto.subtle.digest("SHA-256", buffer).then(digest => {
        return new TextDecoder("utf-8").decode(digest);
      });
    },

    /**
     * Blocks a given link. Adjusts siteMap accordingly, and notifies listeners.
     *
     * @param {Link} aLink The link to block.
     */
    block(aLink) {
      return async(function* () {
        var hashedURL = yield gBlockedLinks._hash(aLink.url);
        gBlockedLinks.links[hashedURL] = 1;

        // Make sure we unpin blocked links.
        gPinnedLinks.unpin(aLink);
        yield gBlockedLinks.save();
      })();
    },

    /**
     * Unblocks a given link. Adjusts siteMap accordingly, and notifies listeners.
     *
     * @param {Link} aLink The link to unblock.
     */
    unblock(aLink) {
      return async(function* () {
        var isBlocked = yield gBlockedLinks.isBlocked(aLink);
        if (isBlocked) {
          var hashedURL = yield gBlockedLinks._hash(aLink.url);
          delete gBlockedLinks.links[hashedURL];
          yield gBlockedLinks.save();
        }
      })();
    },

    /**
     * Saves the current list of blocked links.
     */
    save() {
      return gUserDatabase.save("prefs", "blockedLinks", JSON.stringify(this.links));
    },

    /**
     * Returns whether a given link is blocked.
     *
     * @param {Link} aLink The link to check.
     */
    isBlocked(aLink) {
      return async(function* () {
        var hashedLink = yield gBlockedLinks._hash(aLink.url);
        return (hashedLink in gBlockedLinks.links);
      })();
    },

    /**
     * Checks whether the list of blocked links is empty.
     *
     * @return {Boolean} Whether the list is empty.
     */
    isEmpty() {
      return Object.keys(this.links).length === 0;
    },

    /**
     * Resets the links cache and IDB object.
     */
    reset() {
      this._links = {};
      return this.save();
    },
  };
  exports.gBlockedLinks = gBlockedLinks;
}(window));
