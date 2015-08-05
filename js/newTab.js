/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const XUL_NAMESPACE = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

const TILES_EXPLAIN_LINK = "https://support.mozilla.org/kb/how-do-tiles-work-firefox";
const TILES_INTRO_LINK = "https://www.mozilla.org/firefox/tiles/";
const TILES_PRIVACY_LINK = "https://www.mozilla.org/privacy/";

let gNewTab = {

  listeners: {},

  init: function() {
    // Add a listener for messages sent from the browser.
    // The listener calls our associated callback functions.
    window.addEventListener("message", message => {
      for (let callback of this.listeners[message.data.name]) {
        callback(message.data.data);
      }
    }, false);
  },

  newTabString: function(name, args) {
    let stringName = "newtab." + name;
    if (!args) {
      return gStrings[stringName];
    }
    return formatStringFromName(stringName, args, args.length);
  },

  formatStringFromName: function(str, substrArr) {
    let regExp = /%[0-9]\$S/g;
    let matches;
    while (matches = regExp.exec(str)) {
      let match = matches[0];
      let index = match.charAt(1); // Get the digit in the regExp.
      str = str.replace(match, substrArr[index - 1]);
    }
    return str;
  },

  stringifySites: function() {
    let stringifiedSites = [];
    for (let site of gGrid.sites) {
      stringifiedSites.push(site ? JSON.stringify(site._link) : site);
    }
    return stringifiedSites;
  },

  sendToBrowser: function(type, data) {
    let event = new CustomEvent("NewTabCommand", {
      detail: {
        command: type,
        data: data
      }
    });
    try {
      document.dispatchEvent(event);
    } catch (e) {
      console.log(e);
    }
  },

  registerListener: function(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);

    // If this is the first callback we've created for this message type,
    // inform the browser to send us these message types.
    if (this.listeners[type].length == 1) {
      this.sendToBrowser("NewTab:Register", {type});
    }
  },

  inPrivateBrowsingMode: function() {
    return false;
    //return PrivateBrowsingUtils.isContentWindowPrivate(window);
  }
}

// Everything is loaded. Initialize the New Tab Page.
gNewTab.init();
window.addEventListener("load", () => {
  gPage.init();
});

