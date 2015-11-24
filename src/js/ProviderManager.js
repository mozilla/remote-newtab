/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals async, DirectoryLinksProvider, Links, PlacesProvider, gUserDatabase, gPinnedLinks, gBlockedLinks*/

/**
 * Singleton that handles link providers.
 */

 "use strict";

const ProviderManager = {

  _initialized: false,

  get initialized() {
    return this._initialized;
  },

  set initialized(initialized) {
    this._initialized = initialized;
  },

  init: async(function*(requestURL) {
    if (!ProviderManager.initialized) {
      yield DirectoryLinksProvider.init(requestURL);
      Links.addProvider(PlacesProvider);
      Links.addProvider(DirectoryLinksProvider);
      yield gUserDatabase.init({"pinnedLinks": [], "blockedLinks": []});
      yield gPinnedLinks.init();
      yield gBlockedLinks.init();
      ProviderManager.initialized = true;
    }
  }),

  /**
   * Extract a "site" from a url in a way that multiple urls of a "site" returns
   * the same "site."
   *
   * @param {String} url Url spec string
   * @return {String} The "site" string
   */
  extractSite(url) {
    var host = "";
    try {
      // Note that URL interface might throw for non-standard urls.
      host = new URL(url).host;
    } catch (ex) {
      return "";
    }

    // Strip off common subdomains of the same site (e.g., www, load balancer)
    return host.replace(/^(m|mobile|www\d*)\./, "");
  },
};
