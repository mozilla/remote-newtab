/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global swMessage, gNewTab, async, gGrid, gIntro, gDrag, gCustomize, gUndoDialog, gDropTargetShim, gUserDatabase */

"use strict";
(function(exports) {

  // The amount of time we wait while coalescing updates for hidden pages.
  const SCHEDULE_UPDATE_TIMEOUT_MS = 1000;

  /**
   * This singleton represents the whole 'New Tab Page' and takes care of
   * initializing all its components.
   */
  const gPage = {
    /**
     * Initializes the page.
     */
    init() {
      gNewTab.registerListener("NewTab:UpdatePages",
        this.update.bind(this));
      gNewTab.registerListener("NewTab:RegularThumbnailURI",
        this.storeAndShowRegularThumb.bind(this));

      // Listen for 'unload' to unregister this page.
      addEventListener("unload", this, false);

      // XXX bug 991111 - Not all click events are correctly triggered when
      // listening from xhtml nodes -- in particular middle clicks on sites, so
      // listen from the xul window and filter then delegate
      addEventListener("click", this, false);

      addEventListener("unload", this, false);

      // Check if the new tab feature is enabled.
      if (gNewTab.enabled) {
        this._init();
      }

      this._updateAttributes(gNewTab.enabled);

      // Initialize customize controls.
      gCustomize.init();

      // Initialize intro panel.
      gIntro.init();
    },

    /**
     * Updates the page's grid right away for visible pages. If the page is
     * currently hidden, i.e. in a background tab or in the preloader, then we
     * batch multiple update requests and refresh the grid once after a short
     * delay. Accepts a single parameter the specifies the reason for requesting
     * a page update. The page may decide to delay or prevent a requested updated
     * based on the given reason.
     */
    update(message) {
      if (message === null) {
        return;
      }

      // Do not refresh the entire grid for the page we're on, as refreshing will
      // cause tiles to flash briefly. It is ok to refresh pages not currently visible
      // but ignore updates for the currently visible page.
      if (gNewTab.windowID === message.outerWindowID || !message.refreshPage &&
        message.reason !== "links-changed") {
        // We do, however, want to update the grid if the tiles have changed location
        // due to unpinning, blocking or restoring.
        this.sendUpdateToTest();
        return;
      }
      // Update immediately if we're visible.
      if (!document.hidden) {
        if (gGrid.ready) {
          gGrid.refresh(message);
        }
        return;
      }

      // Bail out if we scheduled before.
      if (this._scheduleUpdateTimeout) {
        return;
      }

      this._scheduleUpdateTimeout = setTimeout(() => {
        // Refresh if the grid is ready.
        if (gGrid.ready) {
          gGrid.refresh(message);
        }

        this._scheduleUpdateTimeout = null;
      }, SCHEDULE_UPDATE_TIMEOUT_MS);
    },

    sendUpdateToTest: function() {
      setTimeout(() => {
        let event = new CustomEvent("AboutNewTabUpdated");
        document.dispatchEvent(event);
      }, SCHEDULE_UPDATE_TIMEOUT_MS);
    },

    /**
     * Internally initializes the page. This runs only when/if the feature
     * is/gets enabled.
     */
    _init() {
      if (this._initialized) {
        return;
      }

      this._initialized = true;

      // Initialize search.
      //gSearch.init();

      if (document.hidden) {
        addEventListener("visibilitychange", this);
      } else {
        setTimeout(this.onPageFirstVisible.bind(this), 0);
      }

      // Initialize and render the grid.
      gGrid.init();

      // Initialize the drop target shim.
      gDropTargetShim.init();

      if (navigator.platform.indexOf("Mac") !== -1) {
        // Workaround to prevent a delay on MacOSX due to a slow drop animation.
        document.addEventListener("dragover", this, false);
        document.addEventListener("drop", this, false);
      }
    },

    /**
     * Updates the 'data-page-disabled' attributes of the respective DOM nodes.
     *
     * @param {Boolean} aValue Whether the New Tab Page is enabled or not.
     */
    _updateAttributes(aValue) {
      // Set the nodes' states.
      let nodeSelector = "#newtab-grid, #newtab-search-container";
      for (let node of document.querySelectorAll(nodeSelector)) {
        if (aValue) {
          node.pageDisabled = false;
        } else {
          node.pageDisabled = true;
        }
      }

      // Enables/disables the control and link elements.
      let inputSelector = ".newtab-control, .newtab-link";
      for (let input of document.querySelectorAll(inputSelector)) {
        if (aValue) {
          input.removeAttribute("tabindex");
        } else {
          input.setAttribute("tabindex", "-1");
        }
      }
    },

    /**
     * Handles unload event
     */
    _handleUnloadEvent() {
      // compute page life-span and send telemetry probe: using milli-seconds will leave
      // many low buckets empty. Instead we use half-second precision to make low end
      // of histogram linear and not loose the change in user attention
      let delta = Math.round((Date.now() - this._firstVisibleTime) / 500);
      if (this._suggestedTilePresent) {
        gNewTab.sendToBrowser("NewTab:UpdateTelemetryProbe", {
          probe: "NEWTAB_PAGE_LIFE_SPAN_SUGGESTED",
          value: delta
        });
      } else {
        gNewTab.sendToBrowser("NewTab:UpdateTelemetryProbe", {
          probe: "NEWTAB_PAGE_LIFE_SPAN",
          value: delta
        });
      }

      // Close the database connection when a tab is closed.
      gUserDatabase.close();
    },

    handleEnabled(enabled) {
      this._updateAttributes(enabled);
      // Initialize the whole page if we haven't done that, yet.
      if (enabled) {
        this._init();
      } else {
        gUndoDialog.hide();
      }
    },

    /**
     * Handles all page events.
     */
    handleEvent(aEvent) {
      switch (aEvent.type) {
      case "load":
        this.onPageVisibleAndLoaded();
        break;
      case "unload":
        this._handleUnloadEvent();
        break;
      case "click":
        let {
          target
        } = aEvent;
        // Go up ancestors until we find a Site or not
        while (target) {
          if (target.hasOwnProperty("_newtabSite")) {
            target._newtabSite.onClick(aEvent);
            break;
          }
          target = target.parentNode;
        }
        break;
      case "dragover":
        if (gDrag.isValid(aEvent) && gDrag.draggedSite) {
          aEvent.preventDefault();
        }
        break;
      case "drop":
        if (gDrag.isValid(aEvent) && gDrag.draggedSite) {
          aEvent.preventDefault();
          aEvent.stopPropagation();
        }
        break;
      case "visibilitychange":
        // Cancel any delayed updates for hidden pages now that we're visible.
        if (this._scheduleUpdateTimeout) {
          clearTimeout(this._scheduleUpdateTimeout);
          this._scheduleUpdateTimeout = null;

          // An update was pending so force an update now.
          this.update();
        }

        setTimeout(() => this.onPageFirstVisible());
        removeEventListener("visibilitychange", this);
        break;
      }
    },

    onPageFirstVisible() {
      // Record another page impression.
      gNewTab.sendToBrowser("NewTab:UpdateTelemetryProbe", {
        probe: "NEWTAB_PAGE_SHOWN",
        value: true
      });

      for (let site of gGrid.sites) {
        if (site) {
          // The site may need to modify and/or re-render itself if
          // something changed after newtab was created by preloader.
          // For example, the suggested tile endTime may have passed.
          site.onFirstVisible();
        }
      }

      // save timestamp to compute page life-span delta
      this._firstVisibleTime = Date.now();

      if (document.readyState === "complete") {
        this.onPageVisibleAndLoaded();
      } else {
        addEventListener("load", this);
      }
    },

    onPageVisibleAndLoaded() {
      // Send the index of the last visible tile.
      this.reportLastVisibleTileIndex();

      // Show the panel now that anchors are sized
      gIntro.showIfNecessary();
    },

    reportLastVisibleTileIndex() {
      let cells = document.getElementsByClassName("newtab-cell");
      let lastIndex = cells.length - 1;
      for (let site of gGrid.sites) {
        if (site && site.link.targetedSite) {
          this._suggestedTilePresent = true;
        }
      }
      gNewTab.sendToBrowser("NewTab:ReportSitesAction", {
        sites: gNewTab.stringifySites(gGrid.sites),
        action: "view",
        index: lastIndex
      });
    },

    storeAndShowRegularThumb: async(function* (message) {
      let {blob, url, thumbPath: thumbURL} = message;
      let site = gGrid.sites.find(site => site && url === site.url);
      if (!site) {
        return;
      }
      // show it
      let imgSrc = URL.createObjectURL(blob);
      site.showRegularThumbnail(imgSrc);

      // Store it
      let promisedArrayBuffer = new Promise((resolve, reject) => {
        let fileReader = new FileReader();
        fileReader.onload = function() {
          resolve(this.result);
        };
        fileReader.onerror = function() {
          reject(new Error("Could not create ArrayBuffer."));
        };
        fileReader.readAsArrayBuffer(blob);
      });
      let arrayBuffer;
      try {
        arrayBuffer = yield promisedArrayBuffer;
      } catch (err) {
        console.error(err);
        return;
      }
      // Store the page thumb image.
      let sw = (yield navigator.serviceWorker.ready).active;
      let putThumb = swMessage(sw, "NewTab:PutSiteThumb");
      let result = yield putThumb({
        thumbURL,
        url,
        arrayBuffer,
        type: blob.type
      }, [arrayBuffer]);
      if (!result){
        console.warn("Failed to store thumbnail image:", thumbURL);
      }
    }),
  };
  exports.gPage = gPage;
}(window));
