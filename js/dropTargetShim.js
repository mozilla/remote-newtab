/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gGrid, gDrag, gTransformation */

"use strict";
(function(exports) {
  /**
   * This singleton provides a custom drop target detection. We need this
   * because the default DnD target detection relies on the cursor's position.
   * We want to pick a drop target based on the dragged site's position.
   */
  const gDropTargetShim = {
    /**
     * Cache for the position of all cells, cleaned after drag finished.
     */
    _cellPositions: null,

    /**
     * The last drop target that was hovered.
     */
    _lastDropTarget: null,

    /**
     * Initializes the drop target shim.
     */
    init() {
      gGrid.node.addEventListener("dragstart", this, true);
    },

    /**
     * Add all event listeners needed during a drag operation.
     */
    _addEventListeners() {
      gGrid.node.addEventListener("dragend", this);

      let docElement = document.documentElement;
      docElement.addEventListener("dragover", this);
      docElement.addEventListener("dragenter", this);
      docElement.addEventListener("drop", this);
    },

    /**
     * Remove all event listeners that were needed during a drag operation.
     */
    _removeEventListeners() {
      gGrid.node.removeEventListener("dragend", this);

      let docElement = document.documentElement;
      docElement.removeEventListener("dragover", this);
      docElement.removeEventListener("dragenter", this);
      docElement.removeEventListener("drop", this);
    },

    /**
     * Handles all shim events.
     *
     * @param {Event} aEvent The event to be handled.
     */
    handleEvent(aEvent) {
      switch (aEvent.type) {
      case "dragstart":
        this._dragstart(aEvent);
        break;
      case "dragenter":
        aEvent.preventDefault();
        break;
      case "dragover":
        this._dragover(aEvent);
        break;
      case "drop":
        this._drop(aEvent);
        break;
      case "dragend":
        this._dragend(aEvent);
        break;
      }
    },

    /**
     * Handles the 'dragstart' event.
     *
     * @param {Event} aEvent The 'dragstart' event.
     */
    _dragstart(aEvent) {
      if (aEvent.target.classList.contains("newtab-link")) {
        gGrid.lock();
        this._addEventListeners();
      }
    },

    /**
     * Handles the 'dragover' event.
     *
     * @param {Event} aEvent The 'dragover' event.
     */
    _dragover(aEvent) {
      // XXX bug 505521 - Use the dragover event to retrieve the
      //                  current mouse coordinates while dragging.
      let sourceNode = aEvent.dataTransfer.mozSourceNode.parentNode;
      gDrag.drag(sourceNode._newtabSite, aEvent);

      // Find the current drop target, if there's one.
      this._updateDropTarget(aEvent);

      // If we have a valid drop target,
      // let the drag-and-drop service know.
      if (this._lastDropTarget) {
        aEvent.preventDefault();
      }
    },

    /**
     * Handles the 'drop' event.
     *
     * @param {Event} aEvent The 'drop' event.
     */
    _drop(aEvent) {
      // We're accepting all drops.
      aEvent.preventDefault();

      // Make sure to determine the current drop target
      // in case the dragover event hasn't been fired.
      this._updateDropTarget(aEvent);

      // A site was successfully dropped.
      this._dispatchEvent(aEvent, "drop", this._lastDropTarget);
    },

    /**
     * Handles the 'dragend' event.
     *
     * @param {Event} aEvent The 'dragend' event.
     */
    _dragend(aEvent) {
      if (this._lastDropTarget) {
        if (aEvent.dataTransfer.mozUserCancelled) {
          // The drag operation was cancelled.
          this._dispatchEvent(aEvent, "dragexit", this._lastDropTarget);
          this._dispatchEvent(aEvent, "dragleave", this._lastDropTarget);
        }

        // Clean up.
        this._lastDropTarget = null;
        this._cellPositions = null;
      }

      gGrid.unlock();
      this._removeEventListeners();
    },

    /**
     * Tries to find the current drop target and will fire
     * appropriate dragenter, dragexit, and dragleave events.
     *
     * @param {Event} aEvent The current drag event.
     */
    _updateDropTarget(aEvent) {
      // Let's see if we find a drop target.
      let target = this._findDropTarget(aEvent);

      if (target !== this._lastDropTarget) {
        if (this._lastDropTarget) {
          // We left the last drop target.
          this._dispatchEvent(aEvent, "dragexit", this._lastDropTarget);
        }
        if (target) {
          // We're now hovering a (new) drop target.
          this._dispatchEvent(aEvent, "dragenter", target);
        }
        if (this._lastDropTarget) {
          // We left the last drop target.
          this._dispatchEvent(aEvent, "dragleave", this._lastDropTarget);
        }
        this._lastDropTarget = target;
      }
    },

    /**
     * Determines the current drop target by matching the dragged site's position
     * against all cells in the grid.
     *
     * @return {Object|null} The currently hovered drop target or null.
     */
    _findDropTarget() {
      // These are the minimum intersection values - we want to use the cell if
      // the site is >= 50% hovering its position.
      let minWidth = gDrag.cellWidth / 2;
      let minHeight = gDrag.cellHeight / 2;

      let cellPositions = this._getCellPositions();
      let rect = gTransformation.getNodePosition(gDrag.draggedSite.node);

      // Compare each cell's position to the dragged site's position.
      for (let i = 0; i < cellPositions.length; i++) {
        let inter = rect.intersect(cellPositions[i].rect);

        // If the intersection is big enough we found a drop target.
        if (inter.width >= minWidth && inter.height >= minHeight) {
          return cellPositions[i].cell;
        }
      }

      // No drop target found.
      return null;
    },

    /**
     * Gets the positions of all cell nodes.
     *
     * @return {Object} The (cached) cell positions.
     */
    _getCellPositions() {
      if (this._cellPositions) {
        return this._cellPositions;
      }

      this._cellPositions = gGrid.cells.map((cell) => {
        return {
          cell, rect: gTransformation.getNodePosition(cell.node)
        };
      });
      return this._cellPositions;
    },

    /**
     * Dispatches a custom DragEvent on the given target node.
     *
     * @param {Event} aEvent The source event.
     * @param {String} aType The event type.
     * @param {Node} aTarget The target node that receives the event.
     */
    _dispatchEvent(aEvent, aType, aTarget) {
      let node = aTarget.node;
      let event = document.createEvent("DragEvents");

      // The event should not bubble to prevent recursion.
      event.initDragEvent(aType, false, true, window, 0, 0, 0, 0, 0, false,
        false, false, false, 0, node, aEvent.dataTransfer);

      node.dispatchEvent(event);
    }
  };
  exports.gDropTargetShim = gDropTargetShim;
}(window));
