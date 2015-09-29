/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* globals gPinnedLinks, gUserDatabase */
"use strict";

/**
 * Singleton that keeps track of all blocked links in the grid.
 */
(function(exports, userDB) {
  const gBlockedLinks = {
    /**
     * The cached list of blocked links.
     */
    _links: new Set(),


    /**
     * Load the blocked links from userDB and cache them.
     */
    init() {
      var loadPromise = userDB.load("prefs", "blockedLinks");
      loadPromise.then(loadedLinks => {
        if (loadedLinks && loadedLinks.length) {
          this._links = new Set(JSON.parse(loadedLinks));
        }
      });
      return loadPromise;
    },

    /**
     * Blocks a given link. Adjusts siteMap accordingly, and notifies listeners.
     *
     * @param {Link} aLink The link to block.
     */
    block(aLink) {
      gBlockedLinks._links.add(aLink.url);

      // Make sure we unpin blocked links.
      gPinnedLinks.unpin(aLink);
      return this.save();
    },

    /**
     * Unblocks a given link. Adjusts siteMap accordingly, and notifies listeners.
     *
     * @param {Link} aLink The link to unblock.
     */
    unblock(aLink) {
      var isBlocked = this.isBlocked(aLink);
      if (isBlocked) {
        this._links.delete(aLink.url);
        return this.save();
      }
    },

    /**
     * Saves the current list of blocked links.
     */
    save() {
      return userDB.save("prefs", "blockedLinks", JSON.stringify([...this._links]));
    },

    /**
     * Returns whether a given link is blocked.
     *
     * @param {Link} aLink The link to check.
     */
    isBlocked(aLink) {
      return this._links.has(aLink.url);
    },

    /**
     * Checks whether the list of blocked links is empty.
     *
     * @return {Boolean} Whether the list is empty.
     */
    isEmpty() {
      return this._links.size === 0;
    },

    /**
     * Resets the links cache and IDB object.
     */
    reset() {
      this._links = new Set();
      return this.save();
    },
  };
  exports.gBlockedLinks = gBlockedLinks;
}(window, gUserDatabase));
