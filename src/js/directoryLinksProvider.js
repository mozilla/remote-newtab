/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
 /*jshint worker:true*/
 /*globals CacheTasks, async, Links*/
"use strict";

(function(exports) {
  // The const that tells where to obtain directory links
  const PREF_DIRECTORY_SOURCE = "https://tiles.services.mozilla.com/v3/links/fetch/en-US/nightly";

  // The frecency of a directory link
  const DIRECTORY_FRECENCY = 1000;

  /**
   * Emits notifications to PlacesProvider and Links
   */
  const DirectoryLinksProvider = {
    _observers: new Set(),

    /**
     * A mapping from eTLD+1 to an enhanced link objects
     */
    _enhancedLinks: new Map(),

    /**
     * A mapping from site to a list of suggested link objects
     */
    _suggestedLinks: new Map(),

    init: async(function*(requestURL) {
      Links.addObserver(DirectoryLinksProvider);
      let response = yield CacheTasks.update(requestURL || PREF_DIRECTORY_SOURCE, "ads_cache");
      DirectoryLinksProvider._links = yield response.json();
      if (requestURL) {
        DirectoryLinksProvider._links = DirectoryLinksProvider._links[0];
      }
    }),

    /**
     * Get the enhanced link object for a link (whether history or directory)
     */
    getEnhancedLink(link) {
      // Use the provided link if it's already enhanced
      return link.enhancedImageURI && link ? link :
             this._enhancedLinks.get(Links.extractSite(link.url));
    },

    _cacheSuggestedLinks(link) {
      // Don't cache links that don't have the expected 'frecent_sites'
      if (!link.hasOwnProperty("frecent_sites")) {
        return;
      }

      //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
      for (let suggestedSite of link.frecent_sites) {
        let suggestedMap = this._suggestedLinks.get(suggestedSite) || new Map();
        suggestedMap.set(link.url, link);
        this._suggestedLinks.set(suggestedSite, suggestedMap);
      }
      //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
    },

    _escapeChars(text) {
      let charMap = new Map([
        ["&", "&amp;"],
        ["<", "&lt;"],
        [">", "&gt;"],
        ["\"", "&quot;"],
        ["'", "&#039;"],
      ]);

      return text.replace(/[&<>"']/g, (character) => charMap.get(character));
    },

    /**
     * Gets the current set of directory links.
     */
    getLinks() {
      let rawLinks = DirectoryLinksProvider._links;

      // Reset the cache of suggested tiles and enhanced images for this new set of links
      DirectoryLinksProvider._enhancedLinks.clear();
      DirectoryLinksProvider._suggestedLinks.clear();

      //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
      rawLinks.suggested
        .filter(link => link.hasOwnProperty("adgroup_name"))
        .forEach((link, position) => {
          link.explanation = DirectoryLinksProvider._escapeChars(link.explanation);
          link.targetedName = DirectoryLinksProvider._escapeChars(link.adgroup_name);

          link.lastVisitDate = rawLinks.suggested.length - position;

          // We cache suggested tiles here but do not push any of them in the links list yet.
          // The decision for which suggested tile to include will be made separately.
          DirectoryLinksProvider._cacheSuggestedLinks(link);
        });
      //jscs:enable requireCamelCaseOrUpperCaseIdentifiers

      let links = rawLinks.directory.map((link, position) => {
        link.lastVisitDate = rawLinks.length - position;
        link.frecency = DIRECTORY_FRECENCY;
        return link;
      });

      // Allow for one link suggestion on top of the default directory links
      DirectoryLinksProvider.maxNumLinks = links.length + 1;

      return links;
    },

    addObserver(aObserver) {
      this._observers.add(aObserver);
    },
  };
  exports.DirectoryLinksProvider = DirectoryLinksProvider;
}(self));
