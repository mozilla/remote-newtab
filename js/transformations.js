/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gGrid, gDrag, Rect*/

"use strict";
(function(exports) {

  /**
   * This singleton allows to transform the grid by repositioning a site's node
   * in the DOM and by showing or hiding the node. It additionally provides
   * convenience methods to work with a site's DOM node.
   */
  const gTransformation = {
    /**
     * Returns the width of the left and top border of a cell. We need to take it
     * into account when measuring and comparing site and cell positions.
     */
    get _cellBorderWidths() {
      let cstyle = window.getComputedStyle(gGrid.cells[0].node, null);
      let widths = {
        left: parseInt(cstyle.getPropertyValue("border-left-width")),
        top: parseInt(cstyle.getPropertyValue("border-top-width"))
      };

      // Cache this value, overwrite the getter.
      Object.defineProperty(this, "_cellBorderWidths", {
        value: widths,
        enumerable: true
      });

      return widths;
    },

    /**
     * Gets a DOM node's position.
     *
     * @param {Node} aNode The DOM node.
     * @return {Rect} A Rect instance with the position.
     */
    getNodePosition(aNode) {
      let {
        scrollX,
        scrollY
      } = window;
      let {
        left, top, width, height
      } = aNode.getBoundingClientRect();
      return new Rect(left + scrollX, top + scrollY, width, height);
    },

    /**
     * Fades a given node from zero to full opacity.
     *
     * @param {Node} aNode The node to fade.
     * @param {Function} aCallback The callback to call when finished.
     */
    fadeNodeIn(aNode, aCallback) {
      this._setNodeOpacity(aNode, 1, function() {
        // Clear the style property.
        aNode.style.opacity = "";

        if (aCallback) {
          aCallback();
        }
      });
    },

    /**
     * Fades a given node from full to zero opacity.
     *
     * @param {Node} aNode The node to fade.
     * @param {Function} aCallback The callback to call when finished.
     */
    fadeNodeOut(aNode, aCallback) {
      this._setNodeOpacity(aNode, 0, aCallback);
    },

    /**
     * Fades a given site from zero to full opacity.
     *
     * @param {Site} aSite The site to fade.
     * @param {Function} aCallback The callback to call when finished.
     */
    showSite(aSite, aCallback) {
      this.fadeNodeIn(aSite.node, aCallback);
    },

    /**
     * Fades a given site from full to zero opacity.
     *
     * @param {Site} aSite The site to fade.
     * @param {Function} aCallback The callback to call when finished.
     */
    hideSite(aSite, aCallback) {
      this.fadeNodeOut(aSite.node, aCallback);
    },

    /**
     * Allows to set a site's position.
     *
     * @param {Site} aSite The site to re-position.
     * @param {Object} aPosition The desired position for the given site.
     */
    setSitePosition(aSite, aPosition) {
      let style = aSite.node.style;
      let {
        top, left
      } = aPosition;

      style.top = top + "px";
      style.left = left + "px";
    },

    /**
     * Freezes a site in its current position by positioning it absolute.
     *
     * @param {Site} aSite The site to freeze.
     */
    freezeSitePosition(aSite) {
      if (this._isFrozen(aSite)) {
        return;
      }

      let style = aSite.node.style;
      let comp = getComputedStyle(aSite.node, null);
      style.width = comp.getPropertyValue("width");
      style.height = comp.getPropertyValue("height");

      aSite.node.data.frozen = true;
      this.setSitePosition(aSite, this.getNodePosition(aSite.node));
    },

    /**
     * Unfreezes a site by removing its absolute positioning.
     *
     * @param {Site} aSite The site to unfreeze.
     */
    unfreezeSitePosition(aSite) {
      if (!this._isFrozen(aSite)) {
        return;
      }

      let style = aSite.node.style;
      style.left = style.top = style.width = style.height = "";
      delete aSite.node.data.frozen;
    },

    /**
     * Slides the given site to the target node's position.
     *
     * @param {Site} aSite The site to move.
     * @param {aCell} aTarget The slide target.
     * @param {Object} aOptions Set of options (see below).
     *        unfreeze - unfreeze the site after sliding
     *        callback - the callback to call when finished
     */
    slideSiteTo(aSite, aTarget, aOptions) {
      let currentPosition = this.getNodePosition(aSite.node);
      let targetPosition = this.getNodePosition(aTarget.node);
      let callback = aOptions && aOptions.callback;

      let self = this;

      function finish() {
        if (aOptions && aOptions.unfreeze) {
          self.unfreezeSitePosition(aSite);
        }

        if (callback) {
          callback();
        }
      }

      // We need to take the width of a cell's border into account.
      targetPosition.left += this._cellBorderWidths.left;
      targetPosition.top += this._cellBorderWidths.top;

      // Nothing to do here if the positions already match.
      if (currentPosition.left === targetPosition.left &&
        currentPosition.top === targetPosition.top) {
        finish();
      } else {
        this.setSitePosition(aSite, targetPosition);
        this._whenTransitionEnded(aSite.node, ["left", "top"], finish);
      }
    },

    /**
     * Rearranges a given array of sites and moves them to their new positions or
     * fades in/out new/removed sites.
     *
     * @param {Array} aSites An array of sites to rearrange.
     * @param {Object} aOptions Set of options (see below).
     *        unfreeze - unfreeze the site after rearranging
     *        callback - the callback to call when finished
     */
    rearrangeSites(aSites, aOptions) {
      let batch = [];
      let cells = gGrid.cells;
      let callback = aOptions && aOptions.callback;
      let unfreeze = aOptions && aOptions.unfreeze;

      aSites.forEach(function(aSite, aIndex) {
        // Do not re-arrange empty cells or the dragged site.
        if (!aSite || aSite === gDrag.draggedSite) {
          return;
        }

        batch.push(new Promise(resolve => {
          if (!cells[aIndex]) {
            // The site disappeared from the grid, hide it.
            this.hideSite(aSite, resolve);
          } else if (this._getNodeOpacity(aSite.node) !== 1) {
            // The site disappeared before but is now back, show it.
            this.showSite(aSite, resolve);
          } else {
            // The site's position has changed, move it around.
            this._moveSite(aSite, aIndex, {
              unfreeze: unfreeze,
              callback: resolve
            });
          }
        }));
      }, this);

      if (callback) {
        Promise.all(batch).then(callback);
      }
    },

    /**
     * Listens for the 'transitionend' event on a given node and calls the given
     * callback.
     *
     * @param {Node} aNode The node that is transitioned.
     * @param {Array} aProperties The properties we'll wait to be transitioned.
     * @param {Function} aCallback The callback to call when finished.
     */
    _whenTransitionEnded(aNode, aProperties, aCallback) {
      let props = new Set(aProperties);
      aNode.addEventListener("transitionend", function onEnd(e) {
        if (props.has(e.propertyName)) {
          aNode.removeEventListener("transitionend", onEnd);
          aCallback();
        }
      });
    },

    /**
     * Gets a given node's opacity value.
     *
     * @param {Node} aNode The node to get the opacity value from.
     * @return {String} The node's opacity value.
     */
    _getNodeOpacity(aNode) {
      let cstyle = window.getComputedStyle(aNode, null);
      return Number.parseInt(cstyle.getPropertyValue("opacity"), 10);
    },

    /**
     * Sets a given node's opacity.
     *
     * @param {Node} aNode The node to set the opacity value for.
     * @param {Number} aOpacity The opacity value to set.
     * @param {Function} aCallback The callback to call when finished.
     */
    _setNodeOpacity(aNode, aOpacity, aCallback) {
      if (this._getNodeOpacity(aNode) === aOpacity) {
        if (aCallback) {
          aCallback();
        }
      } else {
        if (aCallback) {
          this._whenTransitionEnded(aNode, ["opacity"], aCallback);
        }
        aNode.style.opacity = aOpacity;
      }
    },

    /**
     * Moves a site to the cell with the given index.
     *
     * @param {Site} aSite The site to move.
     * @param {ANumber} aIndex The target cell's index.
     * @param {Object} aOptions Options that are directly passed to slideSiteTo().
     */
    _moveSite(aSite, aIndex, aOptions) {
      this.freezeSitePosition(aSite);
      this.slideSiteTo(aSite, gGrid.cells[aIndex], aOptions);
    },

    /**
     * Checks whether a site is currently frozen.
     *
     * @param {Site} aSite The site to check.
     * @return {Boolean} Whether the given site is frozen.
     */
    _isFrozen(aSite) {
      return aSite.node.hasAttribute("data-frozen");
    }
  };
  exports.gTransformation = gTransformation;
}(window));
