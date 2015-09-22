/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* globals gPinnedLinks */
"use strict";

/**
 * Singleton that keeps track of all blocked links in the grid.
 */
(function(exports) {
  const gBlockedLinks = {
    /**
     * The cached list of blocked links.
     */
    _links: null,

    /**
     * The list of blocked links.
     */
    get links() {
      /*if (!this._links) {
        this._links = Storage.get("blockedLinks", {});
      }*/

      return this._links;
    },

    /**
     * Blocks a given link. Adjusts siteMap accordingly, and notifies listeners.
     *
     * @param {Link} aLink The link to block.
     */
    block(aLink) {
      //this.links[toHash(aLink.url)] = 1;
      this.save();

      // Make sure we unpin blocked links.
      gPinnedLinks.unpin(aLink);
    },

    /**
     * Unblocks a given link. Adjusts siteMap accordingly, and notifies linksteners.
     *
     * @param {Link} aLink The link to unblock.
     */
    unblock(aLink) {
      if (this.isBlocked(aLink)) {
        //delete this.links[toHash(aLink.url)];
        this.save();
      }
    },

    /**
     * Saves the current list of blocked links.
     */
    save() {
      console.log("beep");
      //Storage.set("blockedLinks", this.links);
    },

    /**
     * Returns whether a given link is blocked.
     *
     * @param {Link} aLink The link to check.
     */
    isBlocked(aLink) {
      return aLink.url;
      //return (toHash(aLink.url) in this.links);
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
     * Resets the links cache.
     */
    resetCache() {
      this._links = null;
    },
  };
  exports.gBlockedLinks = gBlockedLinks;
}(window));
