/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals async, DirectoryLinksProvider, Links, PlacesProvider, gUserDatabase, gPinnedLinks, gBlockedLinks*/

/**
 * Singleton that handles link providers.
 */

 "use strict";

const ProviderManager = {
  init: async(function*(gMockFetch) {
    if (!ProviderManager._initialized) {
      yield DirectoryLinksProvider.init(gMockFetch);
      Links.addProvider(PlacesProvider);
      Links.addProvider(DirectoryLinksProvider);
      yield gUserDatabase.init({"pinnedLinks": [], "blockedLinks": []});
      yield gPinnedLinks.init();
      yield gBlockedLinks.init();
      ProviderManager._initialized = true;
    }
  }),

  /**
   * Extract a "site" from a url in a way that multiple urls of a "site" returns
   * the same "site."
   *
   * @param {URL} url Url spec string
   * @return {String} The "site" string or null
   */
  extractSite(url) {
    var host;
    try {
      // Note that nsIURI.asciiHost throws NS_ERROR_FAILURE for some types of
      // URIs, including jar and moz-icon URIs.
      host = new URL(url).host;
    } catch (ex) {
      return "";
    }

    // Strip off common subdomains of the same site (e.g., www, load balancer)
    return host.replace(/^(m|mobile|www\d*)\./, "");
  },
};
