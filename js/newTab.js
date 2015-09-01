/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gGrid, gPage, gCustomize, gStrings, gUpdater*/

"use strict";

(function(exports) {
  const gNewTab = {
    listeners: {},

    init() {
      // Add a listener for messages sent from the browser.
      // The listener calls our associated callback functions.
      window.addEventListener("message", message => {
        for (let callback of this.listeners[message.data.name]) {
          callback(message.data.data);
        }
      });
    },

    observe(topic, data) {
      switch (topic) {
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
        gPage.handleEnabled(data);
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
      let isEnhanced =  "browser.newtabpage.enhanced" === topic;
      let isEnabled = "browser.newtabpage.enabled" === topic;
      if (isEnabled || isEnhanced) {
        gCustomize.updateSelected();
      }
    },

    setInitialState(message) {
      this.privateBrowsingMode = message.privateBrowsingMode;
      this.rows = message.rows;
      this.columns = message.columns;
      this.introShown = message.introShown;
      this.windowID = message.windowID;
      this.observe("browser.newtabpage.enabled", message.enabled);
      this.observe("browser.newtabpage.enhanced", message.enhanced);
      gUpdater.init();
      gPage.init();
    },

    newTabString(name, args) {
      let stringName = "newtab." + name;
      if (!args) {
        return gStrings[stringName];
      }
      let len = args.length;
      return this._formatStringFromName(gStrings[stringName], args, len);
    },

    _formatStringFromName(str, substrArr) {
      // Match regex that looks like "%<int>$S" representing variables in our strings
      let regExp = /%[0-9]\$S/g;
      let matches;
      while (matches = regExp.exec(str)) { // jshint ignore:line
        let match = matches[0];
        let index = match.charAt(1); // Get the digit in the regExp.
        str = str.replace(match, substrArr[index - 1]);
      }
      return str;
    },

    stringifySites() {
      let stringifiedSites = [];
      for (let site of gGrid.sites) {
        stringifiedSites.push(site ? JSON.stringify(site.link) : site);
      }
      return stringifiedSites;
    },

    sendToBrowser(type, data) {
      let event = new CustomEvent("NewTabCommand", {
        detail: {
          command: type,
          data: data
        }
      });
      document.dispatchEvent(event);
    },

    registerListener(type, callback) {
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(callback);
      this.sendToBrowser("NewTab:Register", {
        type
      });
    }
  };

  // Document is loaded. Initialize the New Tab Page.
  gNewTab.init();
  document.addEventListener("NewTabCommandReady", () => {
    gUserDatabase.init(gPinnedLinks.setLinks).then(() => {
      gNewTab.registerListener("NewTab:Observe", message => {
        gNewTab.observe(message.topic, message.data);
      });
      gNewTab.registerListener("NewTab:State", gNewTab.setInitialState.bind(gNewTab));
      gNewTab.sendToBrowser("NewTab:GetInitialState");
    });
  });
  exports.gNewTab = gNewTab;
}(window));
