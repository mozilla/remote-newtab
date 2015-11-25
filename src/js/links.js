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
 /*globals gPinnedLinks, gBlockedLinks, DirectoryLinksProvider*/
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

    _filterLinks(pinnedLinks, links) {
      // Create sitesMap to contain only one link at each base domain.
      let sitesMap = pinnedLinks.concat(links)
        .filter(link => link)
        .reduce((map, link) => {
          let site = this.extractSite(link.url);
          return map.get(site) ? map : map.set(site, link);
        }, new Map());

      // Filter blocked and pinned links and duplicate base domains.
      links = links.filter(function(link) {
        let site = Links.extractSite(link.url);
        return !gBlockedLinks.isBlocked(link) &&
               !gPinnedLinks.isPinned(link) &&
               (site && (sitesMap.get(site).url === link.url));
      });
      return links;
    },

    /**
     * Gets the current set of links contained in the grid.
     *
     * @return {Object} The links in the grid.
     */
    getLinks() {
      let pinnedLinks = gPinnedLinks.links.slice();
      let links = this._filterLinks(pinnedLinks, this._getMergedProviderLinks());

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

      pinnedLinks.forEach(link => {
        if (link) {
          link.baseDomain = this.extractSite(link.url);
        }
      });

      // Get the set of enhanced links (if any) from the Directory Links Provider.
      let enhancedLinks = pinnedLinks
        .map(link => link && DirectoryLinksProvider.getEnhancedLink(link));

      return {
        links: pinnedLinks,
        enhancedLinks
      };
    },

    _incrementSiteMap: function(map, link) {
      if (gBlockedLinks.isBlocked(link)) {
        // Don't count blocked URLs.
        return;
      }
      let site = this.extractSite(link.url);
      map.set(site, (map.get(site) || 0) + 1);
    },

    /**
     * Calls getLinks on the given provider and populates our cache for it.
     *
     * @param {Provider} aProvider The provider whose cache will be populated.
     * @param {Object} options {force:false}, when true, populates the provider's
     *                 cache even when it's already filled.
     */
    _populateProviderCache(aProvider, options={force: false}) {
      let  cache = this._providers.get(aProvider);
      if (!cache || options.force) {
        cache = {};
        Links._providers.set(aProvider, cache);
      }
      let links = aProvider.getLinks()
        // Filter out null and undefined links so we don't have to deal with
        // them in getLinks when merging links from providers.
        .filter(link => link);
      cache.sortedLinks = links;
      cache.siteMap = links.reduce((map, link) => {
        Links._incrementSiteMap(map, link);
        return map;
      }, new Map());
      cache.linkMap = links.reduce((map, link) => {
        map.set(link.url, link);
        return map;
      }, new Map());
    },

    /**
     * Populates the cache with fresh links from the providers.
     *
     * @param {Boolean} aForce When true, populates the cache even when it's already filled.
     */
    populateCache(aForce) {
      Array.from(this._providers.keys())
        .forEach(provider => this._populateProviderCache(provider, {force: aForce}));
    },

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
  exports.Links = Links;
}(self));
