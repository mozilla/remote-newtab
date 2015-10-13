/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gGrid, gPage, gCustomize, gStrings, gUpdater, gUserDatabase,
  gPinnedLinks, gBlockedLinks, async, swMessage*/

"use strict";

(function(exports) {
  const gNewTab = {

    listeners: {},

    _l10nStrings: new Map(),

    init() {
      return async.task(function*() {
        // Add a listener for messages sent from the browser.
        // The listener calls our associated callback functions.
        window.addEventListener("message", message => {
          for (let callback of this.listeners[message.data.name]) {
            callback(message.data.data);
          }
        });
        let json = {};
        try {
          let request = new Request("./locale/strings.json");
          let response = yield CacheTasks.update(request, "skeleton_cache");
          json = yield response.json();
        } catch (err) {
          console.warn("Error handling localized strings.", err);
        }
        // Save the strings in the map
        Object.getOwnPropertyNames(json)
          // weed out any potentially empty values
          .filter(name => name.trim())
          .forEach(
            name => this._l10nStrings.set(name, json[name])
          );
      }, this);
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
        gPage.handleEnhanced(data);
        break;
      case "browser.newtabpage.rows":
        this.rows = data;
        break;
      case "browser.newtabpage.columns":
        this.columns = data;
        break;
      }
    },

    setInitialState: async(function* (message) {
      let sw = (yield navigator.serviceWorker.ready).active;
      let cacheHistoryLinks = swMessage(sw, "NewTab:CacheHistoryLinks");
      yield cacheHistoryLinks({placesLinks: message.placesLinks});

      gNewTab.privateBrowsingMode = message.privateBrowsingMode;
      gNewTab.rows = message.rows;
      gNewTab.columns = message.columns;
      gNewTab.introShown = message.introShown;
      gNewTab.windowID = message.windowID;
      gNewTab.observe("browser.newtabpage.enabled", message.enabled);
      gNewTab.observe("browser.newtabpage.enhanced", message.enhanced);
      gUpdater.init();
      gPage.init();
    }),

    newTabString(name, args) {
      let key = "newtab-" + name;
      if (!args) {
        return this._l10nStrings.get(key);
      }
      let len = args.length;
      return this._formatStringFromName(this._l10nStrings.get(key), args, len);
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

    sendToBrowser(command, data = "") {
      let event = new CustomEvent("NewTabCommand", {
        detail: {
          command,
          data,
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
  document.addEventListener("NewTabCommandReady", async(function* () {
    let sw = (yield navigator.serviceWorker.ready).active;
    let initProviderManager = swMessage(sw, "NewTab:InitProviderManager");
    yield initProviderManager();

    yield gUserDatabase.init(this._prefsObjectStoreKeys);
    yield gPinnedLinks.init();
    yield gBlockedLinks.init();
    gNewTab.registerListener("NewTab:Observe", message => {
      gNewTab.observe(message.topic, message.data);
    });
    gNewTab.registerListener("NewTab:State", gNewTab.setInitialState.bind(gNewTab));
    gNewTab.sendToBrowser("NewTab:GetInitialState");
  }, gNewTab));
  exports.gNewTab = gNewTab;
}(window));
