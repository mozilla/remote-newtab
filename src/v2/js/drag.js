/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gTransformation, gGrid, gDragDataHelper*/

"use strict";
(function(exports) {
  /**
   * This singleton implements site dragging functionality.
   */
  const gDrag = {
    /**
     * The site offset to the drag start point.
     */
    _offsetX: null,
    _offsetY: null,

    /**
     * The site that is dragged.
     */
    _draggedSite: null,
    get draggedSite() {
      return this._draggedSite;
    },

    /**
     * The cell width/height at the point the drag started.
     */
    _cellWidth: null,
    _cellHeight: null,
    get cellWidth() {
      return this._cellWidth;
    },
    get cellHeight() {
      return this._cellHeight;
    },

    /**
     * Start a new drag operation.
     *
     * @param {Site} aSite The site that's being dragged.
     * @param {Event} aEvent The 'dragstart' event.
     */
    start(aSite, aEvent) {
      this._draggedSite = aSite;

      // Mark nodes as being dragged.
      let selector = ".newtab-site, .newtab-control, .newtab-thumbnail";
      let parentCell = aSite.node.parentNode;
      for (let node of parentCell.querySelectorAll(selector)) {
        node.dataset.dragged = true;
      }

      parentCell.dataset.dragged = true;

      this._setDragData(aSite, aEvent);

      // Store the cursor offset.
      let node = aSite.node;
      let rect = node.getBoundingClientRect();
      this._offsetX = aEvent.clientX - rect.left;
      this._offsetY = aEvent.clientY - rect.top;

      // Store the cell dimensions.
      let cellNode = aSite.cell.node;
      this._cellWidth = cellNode.offsetWidth;
      this._cellHeight = cellNode.offsetHeight;

      gTransformation.freezeSitePosition(aSite);
    },

    /**
     * Handles the 'drag' event.
     *
     * @param {Site} aSite The site that's being dragged.
     * @param {Event} aEvent The 'drag' event.
     */
    drag(aSite, aEvent) {
      // Get the viewport size.
      let {
        clientWidth, clientHeight
      } = document.documentElement;

      let {
        scrollY, scrollX
      } = window;

      // We'll want a padding of 5px.
      let border = 5;

      // Enforce minimum constraints to keep the drag image inside the window.
      let left = Math.max(scrollX + aEvent.clientX - this._offsetX, border);
      let top = Math.max(scrollY + aEvent.clientY - this._offsetY, border);

      // Enforce maximum constraints to keep the drag image inside the window.
      left = Math.min(left, scrollX + clientWidth - this.cellWidth - border);
      top = Math.min(top, scrollY + clientHeight - this.cellHeight - border);

      // Update the drag image's position.
      gTransformation.setSitePosition(aSite, {
        left: left,
        top: top
      });
    },

    /**
     * Ends the current drag operation.
     *
     * @param {Site} aSite The site that's being dragged.
     */
    end(aSite) {
      for (let node of gGrid.node.querySelectorAll("[data-dragged]")) {
        node.dataset.dragged = false;
      }

      // Slide the dragged site back into its cell (may be the old or the new cell).
      gTransformation.slideSiteTo(aSite, aSite.cell, {
        unfreeze: true
      });

      this._draggedSite = null;
    },

    /**
     * Checks whether we're responsible for a given drag event.
     *
     * @param {Event} aEvent The drag event to check.
     * @return {Boolean} Whether we should handle this drag and drop operation.
     */
    isValid(aEvent) {
      let link = gDragDataHelper.getLinkFromDragEvent(aEvent);

      // Check that the drag data is non-empty.
      // Can happen when dragging places folders.
      if (!link || !link.url) {
        return false;
      }
      return true;
    },

    /**
     * Initializes the drag data for the current drag operation.
     *
     * @param {Site} aSite The site that's being dragged.
     * @param {Event} aEvent The 'dragstart' event.
     */
    _setDragData(aSite, aEvent) {
      let {
        url, title
      } = aSite;

      let dt = aEvent.dataTransfer;
      dt.mozCursor = "default";
      dt.effectAllowed = "move";
      dt.setData("text/plain", url);
      dt.setData("text/uri-list", url);
      dt.setData("text/x-moz-url", url + "\n" + title);
      dt.setData("text/html", "<a href=\"" + url + "\">" + url + "</a>");

      // Create and use an empty drag element. We don't want to use the default
      // drag image with its default opacity.
      let dragElement = document.createElement("div");
      dragElement.classList.add("newtab-drag");
      let scrollbox = document.getElementById("newtab-vertical-margin");
      scrollbox.appendChild(dragElement);
      dt.setDragImage(dragElement, 0, 0);

      // After the 'dragstart' event has been processed we can remove the
      // temporary drag element from the DOM.
      setTimeout(() => scrollbox.removeChild(dragElement), 0);
    }
  };
  exports.gDrag = gDrag;
}(window));
