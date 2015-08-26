/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gNewTab, Site, Cell*/

"use strict";
(function(exports) {
  /**
   * Define various fixed dimensions
   */
  const GRID_BOTTOM_EXTRA = 7; // title's line-height extends 7px past the margin
  const GRID_WIDTH_EXTRA = 1; // provide 1px buffer to allow for rounding error
  const REGULAR = "regular";
  const ENHANCED = "enhanced";

  /**
   * This singleton represents the grid that contains all sites.
   */
  const gGrid = {
    /**
     * The DOM node of the grid.
     */
    _node: null,
    get node() {
      return this._node;
    },

    /**
     * The cached DOM fragment for sites.
     */
    _siteFragment: null,

    /**
     * All cells contained in the grid.
     */
    _cells: [],
    get cells() {
      return this._cells;
    },

    /**
     * All sites contained in the grid's cells. Sites may be empty.
     */
    get sites() {
      return [
        for (cell of this.cells) cell.site
      ];
    },

    // Tells whether the grid has already been initialized.
    get ready() {
      return !!this._ready;
    },

    // Returns whether the page has finished loading yet.
    get isDocumentLoaded() {
      return document.readyState === "complete";
    },

    // The currently pinned links.
    _pinnedLinks: [],

    /**
     * Initializes the grid.
     */
    init() {
      this._node = document.getElementById("newtab-grid");
      this._createSiteFragment();
      addEventListener("resize", this);

      gNewTab.sendToBrowser("NewTab:InitializeGrid");
      gNewTab.registerListener("NewTab:InitializeLinks",
        this.refresh.bind(this));

      // Resize the grid as soon as the page loads.
      if (!this.isDocumentLoaded) {
        addEventListener("load", this);
      }
    },

    /**
     * Creates a new site in the grid.
     *
     * @param {Link} aLink The new site's link.
     * @param {Cell} aCell The cell that will contain the new site.
     * @param {Type} aType The type of the site. Type defaults to regular
     * @return {Site} The newly created site.
     */
    createSite(aLink, aCell, aType = REGULAR) {
      let node = aCell.node;
      node.appendChild(this._siteFragment.cloneNode(true));
      return new Site(node.firstElementChild, aLink, aType);
    },

    /**
     * Handles all grid events.
     */
    handleEvent(aEvent) {
      switch (aEvent.type) {
      case "load":
      case "resize":
        this._resizeGrid();
        break;
      }
    },

    /**
     * Locks the grid to block all pointer events.
     */
    lock() {
      this.node.setAttribute("locked", "true");
    },

    /**
     * Unlocks the grid to allow all pointer events.
     */
    unlock() {
      this.node.removeAttribute("locked");
    },

    /**
     * Renders the grid, including cells and sites.
     */
    refresh(message) {
      let links = message.links;
      let enhancedLinks = message.enhancedLinks;
      let cell = document.createElement("div");
      cell.classList.add("newtab-cell");

      // Creates all the cells up to the maximum
      let fragment = document.createDocumentFragment();
      let rows = Math.max(1, gNewTab.rows);
      let columns = Math.max(1, gNewTab.columns);
      for (let i = 0; i < columns * rows; i++) {
        fragment.appendChild(cell.cloneNode(true));
      }

      // Create cells.
      let cells = [];
      for (let cell of fragment.childNodes) {
        cells.push(new Cell(this, cell));
      }

      // Create sites.
      let numLinks = Math.min(links.length, cells.length);
      for (let i = 0; i < numLinks; i++) {
        if (links[i]) {
          // If the link is enhanced, and enhanced is turned on, then use the enhanced link.
          if (enhancedLinks[i] && gNewTab.enhanced) {
            this.createSite(enhancedLinks[i], cells[i], ENHANCED);
          } else {
            this.createSite(links[i], cells[i], REGULAR);
          }
        }
      }

      this._cells = cells;
      this._node.innerHTML = "";
      this._node.appendChild(fragment);
      this._ready = true;

      this._pinnedLinks = message.pinnedLinks;

      // If fetching links took longer than loading the page itself then
      // we need to resize the grid as that was blocked until now.
      // We also want to resize now if the page was already loaded when
      // initializing the grid (the user toggled the page).
      this._resizeGrid();

      let event = new CustomEvent("AboutNewTabUpdated", {
        bubbles: true
      });
      document.dispatchEvent(event);
    },

    /**
     * Calculate the height for a number of rows up to the maximum rows.
     *
     * @param {Number} aRows Number of rows defaulting to the max.
     */
    _computeHeight(aRows) {
      let gridRows = Math.max(1, gNewTab.rows);
      aRows = aRows === undefined ? gridRows : Math.min(gridRows, aRows);
      return aRows * this._cellHeight + GRID_BOTTOM_EXTRA;
    },

    /**
     * Creates the DOM fragment that is re-used when creating sites.
     */
    _createSiteFragment() {
      let site = document.createElement("div");
      site.classList.add("newtab-site");
      site.setAttribute("draggable", "true");

      // Create the site's inner HTML code.
      site.innerHTML = `
        <span class="newtab-sponsored">
          ${gNewTab.newTabString("sponsored.button")}
        </span>
        <a class="newtab-link">
          <span class="newtab-thumbnail"></span>
          <span class="newtab-thumbnail enhanced-content"></span>
          <span class="newtab-title"></span>
        </a>
        <input type="button"
               title="${gNewTab.newTabString("pin")}"
               class="newtab-control newtab-control-pin">
        <input type="button"
               title="${gNewTab.newTabString("block")}"
               class="newtab-control newtab-control-block">
        <span class="newtab-suggested"></span>`;

      this._siteFragment = document.createDocumentFragment();
      this._siteFragment.appendChild(site);
    },

    /**
     * Make sure the correct number of rows and columns are visible
     */
    _resizeGrid() {
      // If we're somehow called before the page has finished loading,
      // let's bail out to avoid caching zero heights and widths.
      // We'll be called again when DOMContentLoaded fires.
      // Same goes for the grid if that's not ready yet.
      if (!this.isDocumentLoaded || !this._ready) {
        return;
      }

      // Save the cell's computed height/width including margin and border
      if (this._cellMargin === undefined) {
        let refCell = document.querySelector(".newtab-cell");
        this._cellMargin = parseFloat(getComputedStyle(refCell).marginTop);
        this._cellHeight = refCell.offsetHeight + this._cellMargin +
          parseFloat(getComputedStyle(refCell).marginBottom);
        this._cellWidth = refCell.offsetWidth + this._cellMargin;
      }
      let clientHeight = document.documentElement.clientHeight;
      let availSpace = clientHeight - this._cellMargin -
        document.querySelector("#newtab-search-container").offsetHeight;
      let visibleRows = Math.floor(availSpace / this._cellHeight);
      let columns = Math.max(1, gNewTab.columns);
      this._node.style.height = this._computeHeight() + "px";
      this._node.style.maxHeight = this._computeHeight(visibleRows) + "px";
      this._node.style.maxWidth = columns * this._cellWidth +
        GRID_WIDTH_EXTRA + "px";
    }
  };
  exports.gGrid = gGrid;
}(window));
