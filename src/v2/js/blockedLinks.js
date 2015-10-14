/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* globals gPinnedLinks, gUserDatabase, async */
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
    init: async(function* () {
      var result = yield userDB.load("prefs", "blockedLinks");
      var blockedLinks = JSON.parse(result);
      if (blockedLinks && blockedLinks.length) {
        gBlockedLinks._links.clear();
        blockedLinks.forEach(item => gBlockedLinks._links.add(item));
      }
      return blockedLinks;
    }),

    /**
     * Blocks a given link. Adjusts siteMap accordingly, and notifies listeners.
     *
     * @param {Link} aLink The link to block.
     */
    block(aLink) {
      this._links.add(aLink.url);

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
      return Promise.resolve();
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
      gBlockedLinks._links.clear();
      return gBlockedLinks.save();
    },
  };
  exports.gBlockedLinks = gBlockedLinks;
}(window, gUserDatabase));
