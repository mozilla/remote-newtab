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

  init: async(function*(requestURL) {
    if (!ProviderManager._initialized) {
      yield DirectoryLinksProvider.init(requestURL);
      Links.addProvider(PlacesProvider);
      Links.addProvider(DirectoryLinksProvider);
      yield gUserDatabase.init({"pinnedLinks": [], "blockedLinks": []});
      yield gPinnedLinks.init();
      yield gBlockedLinks.init();
      ProviderManager._initialized = true;
    }
  }),
};
