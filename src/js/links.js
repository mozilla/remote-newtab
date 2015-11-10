/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Singleton that provides access to all links contained in the grid (including
 * the ones that don't fit on the grid). A link is a plain object that looks
 * like this:
 *
 * {
 *   url: "http://www.mozilla.org/",
 *   title: "Mozilla",
 *   frecency: 1337,
 *   lastVisitDate: 1394678824766431,
 * }
 */
 /*globals gPinnedLinks, gBlockedLinks, ProviderManager, DirectoryLinksProvider, async*/

"use strict";

// The maximum number of links Links.getLinks will return.
const LINKS_GET_LINKS_LIMIT = 100;

const Links = {

  maxNumLinks: LINKS_GET_LINKS_LIMIT,

  /**
   * A mapping from each provider to an object { sortedLinks, siteMap, linkMap }.
   * sortedLinks is the cached, sorted array of links for the provider.
   * siteMap is a mapping from base domains to URL count associated with the domain.
   *         The count does not include blocked URLs. siteMap is used to look up a
   *         user's top sites that can be targeted with a suggested tile.
   * linkMap is a Map from link URLs to link objects.
   */
  _providers: new Map(),

  /**
   * A list of objects that are observing links updates.
   */
  _observers: [],

  /**
   * The properties of link objects used to sort them.
   */
  _sortProperties: [
    "frecency",
    "lastVisitDate",
    "url",
  ],

  /**
   * Compares two links.
   *
   * @param {Link} aLink1 The first link.
   * @param {Link} aLink2 The second link.
   * @return {Integer} A negative number if aLink1 is ordered before aLink2, zero if
   *         aLink1 and aLink2 have the same ordering, or a positive number if
   *         aLink1 is ordered after aLink2.
   *
   * NOTE: compareLinks's this object is bound to Links below.
   */
  compareLinks(aLink1, aLink2) {
    for (var prop of this._sortProperties) {
      if (!(prop in aLink1) || !(prop in aLink2)) {
        throw new Error("Comparable link missing required property: " + prop);
      }
    }
    return aLink2.frecency - aLink1.frecency ||
           aLink2.lastVisitDate - aLink1.lastVisitDate ||
           aLink1.url.localeCompare(aLink2.url);
  },

  /**
   * Merges the cached lists of links from all providers whose lists are cached.
   *
   * @return {Array} The merged list.
   */
  _getMergedProviderLinks() {
    // Build a list containing a copy of each provider's sortedLinks list.
    var linkLists = [];
    for (var provider of this._providers.keys()) {
      /*if (!AllPages.enhanced && provider != PlacesProvider) {
        // Only show history tiles if we're not in 'enhanced' mode.
        continue;
      }*/
      var links = this._providers.get(provider);
      if (links && links.sortedLinks) {
        linkLists.push(links.sortedLinks.slice());
      }
    }

    function getNextLink() {
      var minLinks = null;
      for (var links of linkLists) {
        if (links.length &&
            (!minLinks || Links.compareLinks(links[0], minLinks[0]) < 0)) {
          minLinks = links;
        }
      }
      return minLinks ? minLinks.shift() : null;
    }

    var finalLinks = [];
    for (var nextLink = getNextLink();
         nextLink && finalLinks.length < this.maxNumLinks;
         nextLink = getNextLink()) {
      finalLinks.push(nextLink);
    }

    return finalLinks;
  },

  /**
   * Gets the current set of links contained in the grid.
   *
   * @return {Object} The links in the grid.
   */
  getLinks() {
    var pinnedLinks = Array.slice(gPinnedLinks.links);
    var links = this._getMergedProviderLinks();

    var sites = new Set();
    for (var link of pinnedLinks) {
      if (link) {
        sites.add(ProviderManager.extractSite(link.url));
      }
    }

    // Filter blocked and pinned links and duplicate base domains.
    links = links.filter(function(link) {
      var site = ProviderManager.extractSite(link.url);
      if (site === null || sites.has(site)) {
        return false;
      }
      sites.add(site);

      return !gBlockedLinks.isBlocked(link) && !gPinnedLinks.isPinned(link);
    });

    // Try to fill the gaps between pinned links.
    for (var i = 0; i < pinnedLinks.length && links.length; i++) {
      if (!pinnedLinks[i]) {
        pinnedLinks[i] = links.shift();
      }
    }

    // Append the remaining links if any.
    if (links.length) {
      pinnedLinks = pinnedLinks.concat(links);
    }

    for (link of pinnedLinks) {
      if (link) {
        link.baseDomain = ProviderManager.extractSite(link.url);
      }
    }

    // Get the set of enhanced links (if any) from the Directory Links Provider.
    var enhancedLinks = [];
    for (link of pinnedLinks) {
      if (link) {
        enhancedLinks.push(DirectoryLinksProvider.getEnhancedLink(link));
      }
    }

    return {links: pinnedLinks, enhancedLinks};
  },

  _incrementSiteMap: function(map, link) {
    if (gBlockedLinks.isBlocked(link)) {
      // Don't count blocked URLs.
      return;
    }
    var site = ProviderManager.extractSite(link.url);
    map.set(site, (map.get(site) || 0) + 1);
  },

  /**
   * Calls getLinks on the given provider and populates our cache for it.
   *
   * @param {Provider} aProvider The provider whose cache will be populated.
   * @param {Object} cache The provider cache to be populated.
   * @param {Boolean} aForce When true, populates the provider's cache even when it's
   *               already filled.
   */
  _populateProviderCache: async(function*(aProvider, cache, aForce) {
    var createCache = !cache;
    if (createCache) {
      cache = {
        // Start with a resolved promise.
        populatePromise: new Promise(resolve => resolve()),
      };
      Links._providers.set(aProvider, cache);
    }
    // Chain the populatePromise so that calls are effectively queued.
    cache.populatePromise = cache.populatePromise.then(() => {
      return new Promise(resolve => {
        if (!createCache && !aForce) {
          resolve();
          return;
        }
        aProvider.getLinks().then((links) => {
          // Filter out null and undefined links so we don't have to deal with
          // them in getLinks when merging links from providers.
          links = links.filter((link) => !!link);
          cache.sortedLinks = links;
          cache.siteMap = links.reduce((map, link) => {
            Links._incrementSiteMap(map, link);
            return map;
          }, new Map());
          cache.linkMap = links.reduce((map, link) => {
            map.set(link.url, link);
            return map;
          }, new Map());
          resolve();
        });
      });
    });
    yield cache.populatePromise;
  }),

  /**
   * Populates the cache with fresh links from the providers.
   *
   * @param {Boolean} aForce When true, populates the cache even when it's already filled.
   */
  populateCache: async(function*(aForce) {
    for (var provider of Links._providers.keys()) {
      var links = Links._providers.get(provider);
      yield Links._populateProviderCache(provider, links, aForce);
    }
  }),

  /**
   * Registers an object that will be notified when links updates.
   */
  addObserver(aObserver) {
    this._observers.push(aObserver);
  },

  /**
   * Adds a link provider.
   *
   * @param {Provider} aProvider The link provider.
   */
  addProvider(aProvider) {
    this._providers.set(aProvider, null);
    aProvider.addObserver(this);
  },
};
