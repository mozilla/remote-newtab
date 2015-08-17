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

  // NOTE: @emtwo Get rid of private calls to gPage members!!
  observe: function(topic, data) {
    switch(topic) {
      case "page-thumbnail:create":
        if (!gGrid.ready) {
          return;
        }
        for (let site of gGrid.sites) {
          if (site && site.url === data) {
            site.refreshThumbnail();
          }
        }
        break;
      case "browser.newtabpage.enabled":
        this.enabled = data;
        gPage._updateAttributes(this.enabled);
        // Initialize the whole page if we haven't done that, yet.
        if (this.enabled) {
          gPage._init();
        } else {
          gUndoDialog.hide();
        }
        break;
      case "browser.newtabpage.enhanced":
        this.enhanced = data;
        break;
      case "browser.newtabpage.rows":
        this.rows = data;
        break;
      case "browser.newtabpage.columns":
        this.columns = data;
        break;
    }

    if ("browser.newtabpage.enabled" === topic || "browser.newtabpage.enhanced" === topic) {
      gCustomize.updateSelected();
    }
  },

  setState: function(message) {
    this.privateBrowsingMode = message.privateBrowsingMode;
    this.rows = message.rows;
    this.columns = message.columns;
    this.introShown = message.introShown;
    this.observe("browser.newtabpage.enabled", message.enabled);
    this.observe("browser.newtabpage.enhanced", message.enhanced);
    gPage.init();
  },

  newTabString: function(name, args) {
    let stringName = "newtab." + name;
    if (!args) {
      return gStrings[stringName];
    }
    return this._formatStringFromName(gStrings[stringName], args, args.length);
  },

  _formatStringFromName: function(str, substrArr) {
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
    this.sendToBrowser("NewTab:Register", {type});
  }
}

// Document is loaded. Initialize the New Tab Page.
gNewTab.init();
document.addEventListener("NewTabCommandReady", () => {
  gNewTab.registerListener("NewTab:Observe", message => { gNewTab.observe(message.topic, message.data); });
  gNewTab.registerListener("NewTab:State", gNewTab.setState.bind(gNewTab));
  gNewTab.sendToBrowser("NewTab:GetInitialState");
});

