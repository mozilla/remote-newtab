/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gNewTab, gUpdater, gDropPreview, gDrag, gDragDataHelper, gGrid, gDropPreview, gTransformation*/

"use strict";
(function(exports) {
  // A little delay that prevents the grid from being too sensitive when dragging
  // sites around.
  const DELAY_REARRANGE_MS = 100;

  /**
   * This singleton implements site dropping functionality.
   */
  const gDrop = {
    /**
     * The last drop target.
     */
    _lastDropTarget: null,

    /**
     * Handles the 'dragenter' event.
     *
     * @param {Cell} aCell The drop target cell.
     */
    enter(aCell) {
      this._delayedRearrange(aCell);
    },

    /**
     * Handles the 'dragexit' event.
     *
     * @param {Cell} aCell The drop target cell.
     * @param {Event} aEvent The 'dragexit' event.
     */
    exit(aCell, aEvent) {
      aCell = aCell; // FIXME: Defined but never used
      if (aEvent.dataTransfer && !aEvent.dataTransfer.mozUserCancelled) {
        this._delayedRearrange();
      } else {
        // The drag operation has been cancelled.
        this._cancelDelayedArrange();
        this._rearrange();
      }
    },

    /**
     * Handles the 'drop' event.
     *
     * @param {Cell} aCell The drop target cell.
     * @param {Event} aEvent The 'dragexit' event.
     */
    drop(aCell, aEvent) {
      // The cell that is the drop target could contain a pinned site. We need
      // to find out where that site has gone and re-pin it there.
      if (aCell.containsPinnedSite()) {
        this._repinSitesAfterDrop(aCell);
      }

      // Pin the dragged or insert the new site.
      this._pinDraggedSite(aCell, aEvent);

      this._cancelDelayedArrange();

      // Update the grid and move all sites to their new places.
      gUpdater.sendUpdate();
    },

    /**
     * Re-pins all pinned sites in their (new) positions.
     *
     * @param {Cell} aCell The drop target cell.
     */
    _repinSitesAfterDrop(aCell) {
      let sites = gDropPreview.rearrange(aCell);

      // Filter out pinned sites.
      let pinnedSites = sites.filter((aSite) => aSite && aSite.isPinned());

      // Re-pin all shifted pinned cells.
      pinnedSites.forEach(aSite => aSite.pin(sites.indexOf(aSite)));
    },

    /**
     * Pins the dragged site in its new place.
     *
     * @param {Cell} aCell The drop target cell.
     * @param {Event} aEvent The 'dragexit' event.
     */
    _pinDraggedSite(aCell, aEvent) {
      let index = aCell.index;
      let draggedSite = gDrag.draggedSite;

      if (draggedSite) {
        // Pin the dragged site at its new place.
        if (aCell !== draggedSite.cell) {
          draggedSite.pin(index);
        }
      } else {
        let link = gDragDataHelper.getLinkFromDragEvent(aEvent);
        if (link) {
          // A new link was dragged onto the grid. Create it by pinning its URL.
          // Also, make sure the newly added link is not blocked.
          gNewTab.sendToBrowser("NewTab:PinLink", {
            link, index, ensureUnblocked: true
          });
        }
      }
    },

    /**
     * Time a rearrange with a little delay.
     *
     * @param {Cell} aCell The drop target cell.
     */
    _delayedRearrange(aCell) {
      // The last drop target didn't change so there's no need to re-arrange.
      if (this._lastDropTarget === aCell) {
        return;
      }

      let self = this;

      function callback() {
        self._rearrangeTimeout = null;
        self._rearrange(aCell);
      }

      this._cancelDelayedArrange();
      this._rearrangeTimeout = setTimeout(callback, DELAY_REARRANGE_MS);

      // Store the last drop target.
      this._lastDropTarget = aCell;
    },

    /**
     * Cancels a timed rearrange, if any.
     */
    _cancelDelayedArrange() {
      if (this._rearrangeTimeout) {
        clearTimeout(this._rearrangeTimeout);
        this._rearrangeTimeout = null;
      }
    },

    /**
     * Rearrange all sites in the grid depending on the current drop target.
     *
     * @param {Cell} aCell The drop target cell.
     */
    _rearrange(aCell) {
      let sites = gGrid.sites;

      // We need to rearrange the grid only if there's a current drop target.
      if (aCell) {
        sites = gDropPreview.rearrange(aCell);
      }

      gTransformation.rearrangeSites(sites, {
        unfreeze: !aCell
      });
    }
  };
  exports.gDrop = gDrop;
}(window));
