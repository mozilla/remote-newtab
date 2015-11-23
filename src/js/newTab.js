/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals Request, CacheTasks, gGrid, gPage, gUpdater, async*/

"use strict";

(function(exports) {
  const gNewTab = {

    listeners: new Map(),

    _l10nStrings: new Map(),

    privateBrowsingMode: false,

    rows: -1,

    columns: -1,

    introShown: false,

    windowID: -1,

    enabled: true,

    init() {
      return async.task(function*() {
        yield this._cacheL10nStrings();
        this.registerListener("NewTab:Observe", message => {
          this.observe(message.topic, message.data);
        });
        this.registerListener("NewTab:State", message => {
          this._setInitialState(message);
        });
        // Add a listener for messages sent from the browser.
        // The listener calls our associated callback functions.
        window.addEventListener("message", message => {
          let callbacks = this.listeners.get(message.data.name);
          if (!callbacks) {
            let msg = `No callbacks for message: "${message.data.name}"`;
            console.warn(msg);
            return;
          }
          for (let callback of callbacks) {
            callback(message.data.data);
          }
        });
        this.sendToBrowser("NewTab:GetInitialState");
      }, this);
    },
    /**
     * Downloads and stores the localized strings.
     *
     * @return {Promise} Resolves when caching is complete.
     */
    _cacheL10nStrings() {
      return async.task(function*() {
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
          console.warn("Grid is not ready. Can't create page thumb.");
          return;
        }
        gGrid.sites
          .filter(site => site && site.url === data)
          .forEach(site => site.refreshThumbnail());
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

    _setInitialState(message) {
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
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      let callbacks = this.listeners.get(type);
      callbacks.add(callback);
      this.sendToBrowser("NewTab:Register", {
        type
      });
    }
  };
  exports.gNewTab = gNewTab;
}(window));
