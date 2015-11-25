/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
 /*globals gUserDatabase */

/**
 * Singleton that keeps track of all pinned links and their positions in the
 * grid.
 */

(function(exports) {
  "use strict";
  const gPinnedLinks = {
    /**
     * The cached list of pinned links.
     */
    _links: [],

    /**
     * Load the pinned links from gUserDatabase and cache them.
     */
    init() {
      var loadPromise = gUserDatabase.load("prefs", "pinnedLinks");
      loadPromise.then(loadedLinks => {
        this._links = (loadedLinks && loadedLinks.length) ? JSON.parse(loadedLinks) : [];
      });
      return loadPromise;
    },

    /**
     * Get the array of pinned links.
     */
    get links() {
      return this._links;
    },

    /**
     * Pins a link at the given position.
     *
     * @param {Link} aLink The link to pin.
     * @param {Number} aIndex The grid index to pin the cell at.
     */
    pin(aLink, aIndex) {
      // Clear the link's old position, if any.
      this.unpin(aLink);

      // change pinned link into a history link and update pin state
      this._makeHistoryLink(aLink);
      this.links[aIndex] = aLink;
      return this.save();
    },

    /**
     * Unpins a given link.
     *
     * @param {Link} aLink The link to unpin.
     */
    unpin(aLink) {
      var index = this._indexOfLink(aLink);
      if (index === -1) {
        return;
      }
      this._links[index] = null;
      // trim trailing nulls
      var i = this._links.length - 1;
      while (i >= 0 && this._links[i] === null) {
        i--;
      }
      this._links.splice(i + 1);
      return this.save();
    },

    /**
     * Saves the current list of pinned links.
     */
    save() {
      return gUserDatabase.save("prefs", "pinnedLinks", JSON.stringify(this.links));
    },

    /**
     * Checks whether a given link is pinned.
     *
     * @param {Link} aLink The link to check.
     * @return {Boolean} whether The link is pinned.
     */
    isPinned(aLink) {
      return this._indexOfLink(aLink) !== -1;
    },

    /**
     * Resets the links cache.
     */
    resetCache() {
      this._links = [];
    },

    /**
     * Finds the index of a given link in the list of pinned links.
     *
     * @param {Link} aLink The link to find an index for.
     * @return {Number} The link's index.
     */
    _indexOfLink(aLink) {
      return this.links.findIndex(link => link && link.url === aLink.url);
    },

    /**
     * Transforms link into a "history" link
     *
     * @param {Link} aLink The link to change
     */
    _makeHistoryLink(aLink) {
      if (!aLink.type || aLink.type === "history") {
        return;
      }
      aLink.type = "history";
      // always remove targetedSite
      delete aLink.targetedSite;
    },

    /**
     * Replaces existing link with another link.
     *
     * @param {URL} aUrl The url of existing link
     * @param {Link} aLink The replacement link
     */
    replace(aUrl, aLink) {
      var index = this._indexOfLink({url: aUrl});
      if (index === -1) {
        return;
      }
      this.links[index] = aLink;
      return this.save();
    },
  };
  exports.gPinnedLinks = gPinnedLinks;
}(this || self));
