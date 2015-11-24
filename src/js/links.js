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
 /*jshint worker:true*/

"use strict";
(function(exports) {
  const Links = {

    maxNumLinks: 100,

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
     * Compares two links.
     *
     * @param {Link} aLink1 The first link.
     * @param {Link} aLink2 The second link.
     * @return {Integer} -1 if aLink1 is ordered before aLink2, 0 if
     *         aLink1 and aLink2 have the same ordering, or 1 if
     *         aLink1 is ordered after aLink2.
     *
     * NOTE: compareLinks's this object is bound to Links below.
     */
    compareLinks(aLink1, aLink2) {
      // The properties of link objects used to sort them.
      const requiredProps = ["frecency", "lastVisitDate", "url"];
      if (!requiredProps.every(prop => prop in aLink1 && prop in aLink2)) {
        throw new Error("Comparable link missing required property");
      }
      let result = aLink2.frecency - aLink1.frecency ||
                   aLink2.lastVisitDate - aLink1.lastVisitDate ||
                   aLink1.url.localeCompare(aLink2.url);
      return result === 0 ? 0 : result / Math.abs(result);
    },

    /**
     * Merges the cached lists of links from all providers whose lists are cached.
     *
     * @return {Array} The merged list.
     */
    _getMergedProviderLinks() {
      return Array.from(this._providers.values())
        .filter(provider => provider.sortedLinks)
        .reduce((arr, provider) => arr.concat(provider.sortedLinks.slice()), [])
        .sort(this.compareLinks)
        .slice(0, this.maxNumLinks);
    },

    /**
     * Gets the current set of links contained in the grid.
     *
     * @return {Object} The links in the grid.
     */
    getLinks() {
      let pinnedLinks = Array.slice(gPinnedLinks.links);
      let links = this._getMergedProviderLinks();

      let sites = new Set();
      for (let link of pinnedLinks) {
        if (link) {
          sites.add(ProviderManager.extractSite(link.url));
        }
      }

      // Filter blocked and pinned links and duplicate base domains.
      links = links.filter(function(link) {
        let site = ProviderManager.extractSite(link.url);
        if (site === null || sites.has(site)) {
          return false;
        }
        sites.add(site);

        return !gBlockedLinks.isBlocked(link) && !gPinnedLinks.isPinned(link);
      });

      // Try to fill the gaps between pinned links.
      for (let i = 0; i < pinnedLinks.length && links.length; i++) {
        if (!pinnedLinks[i]) {
          pinnedLinks[i] = links.shift();
        }
      }

      // Append the remaining links if any.
      if (links.length) {
        pinnedLinks = pinnedLinks.concat(links);
      }

      for (let link of pinnedLinks) {
        if (link) {
          link.baseDomain = ProviderManager.extractSite(link.url);
        }
      }

      // Get the set of enhanced links (if any) from the Directory Links Provider.
      let enhancedLinks = [];
      for (let link of pinnedLinks) {
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
      let site = ProviderManager.extractSite(link.url);
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
      let createCache = !cache.populatePromise;
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
      for (let provider of Links._providers.keys()) {
        let links = Links._providers.get(provider);
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
      this._providers.set(aProvider, {});
      aProvider.addObserver(this);
    },
  };
  exports.Links = Links;
}(self));
