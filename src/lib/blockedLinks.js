/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* globals gUserDatabase, async */
"use strict";

const async = require("lib/async");
const gUserDatabase = require('lib/userDatabase');

/**
 * Singleton that keeps track of all blocked links in the grid.
 */
const gBlockedLinks = {
  /**
   * The cached list of blocked links.
   */
  _links: new Set(),

  /**
   * Load the blocked links from gUserDatabase and cache them.
   */
  init: async(function*() {
    var result = yield gUserDatabase.load("prefs", "blockedLinks");
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
    var isBlocked = this.isBlocked(aURL);
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
    return gUserDatabase.save("prefs", "blockedLinks", JSON.stringify([...this._links]));
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
    gBlockedLinks._links.clear();
    return gBlockedLinks.save();
  },
};
module.exports = gBlockedLinks;
