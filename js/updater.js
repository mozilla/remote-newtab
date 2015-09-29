/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gNewTab, gTransformation, gGrid, gBlockedLinks*/

"use strict";
(function(exports) {
  /**
   * This singleton provides functionality to update the current grid to a new
   * set of pinned and blocked sites. It adds, moves and removes sites.
   */
  const gUpdater = {
    /**
     * Set up message listener to fetch links when the grid needs to be updated.
     */
    init() {
      let updateGrid = this.updateGrid.bind(this);
      gNewTab.registerListener("NewTab:UpdateLinks", updateGrid);
    },

    /**
     * Updates the current grid according to its pinned and blocked sites.
     * This removes old, moves existing and creates new sites to fill gaps.
     *
     * @param {Object} aMessage The links sent down by the parent process.
     */
    updateGrid(aMessage) {
      // Filter out blocked links.
      for (let i = aMessage.links.length; i--;) {
        if (gBlockedLinks.isBlocked(aMessage.links[i])) {
          aMessage.links.splice(i, 1);
        }
      }

      let links = aMessage.links.slice(0, gGrid.cells.length);

      // Find all sites that remain in the grid.
      let sites = gUpdater._findRemainingSites(links);

      // Remove sites that are no longer in the grid.
      gUpdater._removeLegacySites(sites, () => {
        // Freeze all site positions so that we can move their DOM nodes around
        // without any visual impact.
        gUpdater._freezeSitePositions(sites);

        // Move the sites' DOM nodes to their new position in the DOM. This will
        // have no visual effect as all the sites have been frozen and will
        // remain in their current position.
        gUpdater._moveSiteNodes(sites);

        // Now it's time to animate the sites actually moving to their new
        // positions.
        gUpdater._rearrangeSites(sites, (aCallback) => {
          // Try to fill empty cells and finish.
          gUpdater._fillEmptyCells(links, aCallback);
        });
      });

      let event = new CustomEvent("AboutNewTabUpdated", {
        bubbles: true
      });
      document.dispatchEvent(event);
    },

    /**
     * Sends a message to update the grid.
     */
    sendUpdate() {
      gNewTab.sendToBrowser("NewTab:UpdateGrid");
    },

    /**
     * Takes an array of links and tries to correlate them to sites contained in
     * the current grid. If no corresponding site can be found (i.e. the link is
     * new and a site will be created) then just set it to null.
     *
     * @param {Array} aLinks The array of links to find sites for.
     * @return {Array} Array of sites mapped to the given links (can contain null values).
     */
    _findRemainingSites(aLinks) {
      let map = {};

      // Create a map to easily retrieve the site for a given URL.
      gGrid.sites.forEach(function(aSite) {
        if (aSite) {
          map[aSite.url] = aSite;
        }
      });

      // Map each link to its corresponding site, if any.
      return aLinks.map(function(aLink) {
        return aLink && (aLink.url in map) && map[aLink.url];
      });
    },

    /**
     * Freezes the given sites' positions.
     *
     * @param {Array} aSites The array of sites to freeze.
     */
    _freezeSitePositions(aSites) {
      aSites.forEach(function(aSite) {
        if (aSite) {
          gTransformation.freezeSitePosition(aSite);
        }
      });
    },

    /**
     * Moves the given sites' DOM nodes to their new positions.
     *
     * @param {Array} aSites The array of sites to move.
     */
    _moveSiteNodes(aSites) {
      let cells = gGrid.cells;

      // Truncate the given array of sites to not have more sites than cells.
      // This can happen when the user drags a bookmark (or any other new kind
      // of link) onto the grid.
      let sites = aSites.slice(0, cells.length);

      sites.forEach(function(aSite, aIndex) {
        let cell = cells[aIndex];
        let cellSite = cell.site;

        // The site's position didn't change.
        if (!aSite || cellSite !== aSite) {
          let cellNode = cell.node;

          // Empty the cell if necessary.
          if (cellSite) {
            cellNode.removeChild(cellSite.node);
          }

          // Put the new site in place, if any.
          if (aSite) {
            cellNode.appendChild(aSite.node);
          }
        }
      }, this);
    },

    /**
     * Rearranges the given sites and slides them to their new positions.
     *
     * @param {Array} aSites The array of sites to re-arrange.
     * @param {Function} aCallback The callback to call when finished.
     */
    _rearrangeSites(aSites, aCallback) {
      let options = {
        callback: aCallback,
        unfreeze: true
      };
      gTransformation.rearrangeSites(aSites, options);
    },

    /**
     * Removes all sites from the grid that are not in the given links array or
     * exceed the grid.
     *
     * @param {Array} aSites The array of sites remaining in the grid.
     * @param {Function} aCallback The callback to call when finished.
     */
    _removeLegacySites(aSites, aCallback) {
      let batch = [];

      // Delete sites that were removed from the grid.
      gGrid.sites.forEach(function(aSite) {
        // The site must be valid and not in the current grid.
        if (!aSite || aSites.indexOf(aSite) !== -1) {
          return;
        }

        batch.push(new Promise(resolve => {
          // Fade out the to-be-removed site.
          gTransformation.hideSite(aSite, function() {
            let node = aSite.node;

            // Remove the site from the DOM.
            node.parentNode.removeChild(node);
            resolve();
          });
        }));
      });

      Promise.all(batch).then(aCallback);
    },

    /**
     * Tries to fill empty cells with new links if available.
     *
     * @param {Array} aLinks The array of links.
     * @param {Function} aCallback The callback to call when finished.
     */
    _fillEmptyCells(aLinks, aCallback) {
      let {
        cells, sites
      } = gGrid;

      // Find empty cells and fill them.
      Promise.all(sites.map((aSite, aIndex, aEnhancedLinks) => {
        if (aSite || !aLinks[aIndex]) {
          return null;
        }

        return new Promise(resolve => {
          // Create the new site and fade it in.
          let isEnhanced = aEnhancedLinks[aIndex] ? "enhanced" : "regular";
          let site = gGrid.createSite(aLinks[aIndex],
            cells[aIndex], isEnhanced);

          // Set the site's initial opacity to zero.
          site.node.style.opacity = 0;

          // Flush all style changes for the dynamically inserted site to make
          // the fade-in transition work.
          window.getComputedStyle(site.node).opacity; // jshint ignore:line
          gTransformation.showSite(site, resolve);
        });
      })).then(aCallback).catch(console.exception);
    }
  };
  exports.gUpdater = gUpdater;
}(window));
