/**
 * Singleton that keeps track of all pinned links and their positions in the
 * grid.
 */

(function(exports) {
  const gPinnedLinks = {
    /**
     * The cached list of pinned links.
     */
    _links: null,

    /**
     * Set the array of pinned links.
     */
    setLinks(loadedLinks) {
      gPinnedLinks._links = loadedLinks && loadedLinks.length ? JSON.parse(loadedLinks) : [];
    },

    /**
     * Get the array of pinned links.
     */
    get links() {
      return this._links;
    },

    /**
     * Pins a link at the given position.
     * @param aLink The link to pin.
     * @param aIndex The grid index to pin the cell at.
     */
    pin: function PinnedLinks_pin(aLink, aIndex) {
      // Clear the link's old position, if any.
      this.unpin(aLink);

      // change pinned link into a history link and update pin state
      this._makeHistoryLink(aLink);
      this.links[aIndex] = aLink;
      this.save();
    },

    /**
     * Unpins a given link.
     * @param aLink The link to unpin.
     */
    unpin: function PinnedLinks_unpin(aLink) {
      let index = this._indexOfLink(aLink);
      if (index == -1) {
        return;
      }
      let links = this.links;
      links[index] = null;
      // trim trailing nulls
      let i=links.length-1;
      while (i >= 0 && links[i] == null) {
        i--;
      }
      links.splice(i + 1);
      this.save();
    },

    /**
     * Saves the current list of pinned links.
     */
    save: function PinnedLinks_save() {
      //window.localStorage.pinnedLinks = JSON.stringify(this.links);
      gUserDatabase.save("prefs", "pinnedLinks", JSON.stringify(this.links));
    },

    /**
     * Checks whether a given link is pinned.
     * @params aLink The link to check.
     * @return whether The link is pinned.
     */
    isPinned: function PinnedLinks_isPinned(aLink) {
      return this._indexOfLink(aLink) != -1;
    },

    /**
     * Resets the links cache.
     */
    resetCache: function PinnedLinks_resetCache() {
      this._links = null;
    },

    /**
     * Finds the index of a given link in the list of pinned links.
     * @param aLink The link to find an index for.
     * @return The link's index.
     */
    _indexOfLink: function PinnedLinks_indexOfLink(aLink) {
      for (let i = 0; i < this.links.length; i++) {
        let link = this.links[i];
        if (link && link.url == aLink.url)
          return i;
      }

      // The given link is unpinned.
      return -1;
    },

    /**
     * Transforms link into a "history" link
     * @param aLink The link to change
     * @return true if link changes, false otherwise
     */
    _makeHistoryLink: function PinnedLinks_makeHistoryLink(aLink) {
      if (!aLink.type || aLink.type == "history") {
        return false;
      }
      aLink.type = "history";
      // always remove targetedSite
      delete aLink.targetedSite;
      return true;
    },

    /**
     * Replaces existing link with another link.
     * @param aUrl The url of existing link
     * @param aLink The replacement link
     */
    replace: function PinnedLinks_replace(aUrl, aLink) {
      let index = this._indexOfLink({url: aUrl});
      if (index == -1) {
        return;
      }
      this.links[index] = aLink;
      this.save();
    },
  };
  exports.gPinnedLinks = gPinnedLinks;
}(window));
