const async = require("lib/async");
const userDatabase = require("lib/userDatabase");

/**
 * Singleton that keeps track of all blocked links in the grid.
 */
const blockedLinks = {
  /**
   * The cached list of blocked links.
   */
  _links: new Set(),

  /**
   * Load the blocked links from userDatabase and cache them.
   */
  init: async(function*() {
    const result = yield userDatabase.load("prefs", "blockedLinks");
    const loadedBlockedLinks = JSON.parse(result);
    if (loadedBlockedLinks && loadedBlockedLinks.length) {
      blockedLinks._links.clear();
      loadedBlockedLinks.forEach(item => blockedLinks._links.add(item));
    }
    return blockedLinks;
  }),

  /**
   * Blocks a given link. Adjusts siteMap accordingly, and notifies listeners.
   *
   * @param {String} aURL The link to block.
   */
  block(aURL) {
    this._links.add(aURL);
    return this.save();
  },

  /**
   * Unblocks a given link. Adjusts siteMap accordingly, and notifies listeners.
   *
   * @param {String} aURL The link to unblock.
   */
  unblock(aURL) {
    const isBlocked = this.isBlocked(aURL);
    if (isBlocked) {
      this._links.delete(aURL);
      return this.save();
    }
    return Promise.resolve();
  },

  /**
   * Saves the current list of blocked links.
   */
  save() {
    return userDatabase.save("prefs", "blockedLinks", JSON.stringify([...this._links]));
  },

  /**
   * Returns whether a given link is blocked.
   *
   * @param {String} aURL The link to check.
   */
  isBlocked(aURL) {
    return this._links.has(aURL);
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
    this._links.clear();
    return this.save();
  }
};
module.exports = blockedLinks;
