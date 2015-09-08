/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gDrag, gNewTab, gGrid, gUndoDialog, gPinnedLinks*/

"use strict";

(function(exports) {
  const TILES_EXPLAIN_LINK =
    "https://support.mozilla.org/kb/how-do-tiles-work-firefox";
  const REGULAR = "regular";
  const ENHANCED = "enhanced";
  /**
   * This class represents a site that is contained in a cell and can be pinned,
   * moved around or deleted.
   */
  function Site(aNode, aLink, aType = REGULAR) {
    this._node = aNode;
    this._node._newtabSite = this;

    this._link = aLink;
    this._type = aType;

    this._render();
    this._addEventHandlers();
  }

  Site.prototype = {
    /**
     * The site's DOM node.
     */
    get node() {
      return this._node;
    },

    /**
     * The site's link.
     */
    get link() {
      return this._link;
    },

    /**
     * The url of the site's link.
     */
    get url() {
      return this.link.url;
    },

    /**
     * The title of the site's link.
     */
    get title() {
      return this.link.title || this.link.url;
    },

    /**
     * The site's parent cell.
     */
    get cell() {
      let parentNode = this.node.parentNode;
      return parentNode && parentNode._newtabCell;
    },

    /**
     * Pins the site on its current or a given index.
     *
     * @param {Number} aIndex The pinned index (optional).
     */
    pin(aIndex) {
      if (typeof aIndex === "undefined") {
        aIndex = this.cell.index;
      }

      gNewTab.sendToBrowser("NewTab:GetUpdatePages", {
        link: this._link,
        index: aIndex
      });
      this._updateAttributes(true);
      gPinnedLinks.pin(this._link, aIndex);
    },

    /**
     * Unpins the site.
     */
    unpin() {
      if (this.isPinned()) {
        gNewTab.sendToBrowser("NewTab:GetUpdatePages", {
          link: this._link
        });
        this._updateAttributes(false);
        gPinnedLinks.unpin(this._link);
      }
    },

    /**
     * Checks whether this site is pinned.
     *
     * @return {Boolean} Whether this site is pinned.
     */
    isPinned() {
      return gPinnedLinks.isPinned(this._link);
    },

    /**
     * Blocks the site (removes it from the grid) and calls the given callback
     * when done.
     */
    block() {
      if (!this.isBlocked()) {
        gUndoDialog.show(this);
        gNewTab.sendToBrowser("NewTab:BlockLink", {
          link: this._link
        });
      }
    },

    /**
     * Checks whether this site is blocked.
     *
     * @return {Boolean} Whether this site is blocked.
     */
    isBlocked() {
      return this._link.blockState;
    },

    /**
     * Gets the DOM node specified by the given query selector.
     *
     * @param {String} aSelector The query selector.
     * @return {Element} The DOM Element we found.
     */
    _querySelector(aSelector) {
      return this.node.querySelector(aSelector);
    },

    /**
     * Updates attributes for all nodes which status depends on this site being
     * pinned or unpinned.
     *
     * @param {Boolean} aPinned Whether this site is now pinned or unpinned.
     */
    _updateAttributes: function(aPinned) {
      let control = this._querySelector(".newtab-control-pin");

      if (aPinned) {
        this.node.dataset.pinned = true;
        control.dataset.title = gNewTab.newTabString("unpin");
      } else {
        this.node.dataset.pinned = false;
        control.dataset.title = gNewTab.newTabString("pin");
      }
    },

    _newTabString(str, substrArr) {
      let regExp = /%[0-9]\$S/g;
      let matches;
      while (matches = regExp.exec(str)) { // jshint ignore:line
        let match = matches[0];
        let index = match.charAt(1); // Get the digit in the regExp.
        str = str.replace(match, substrArr[index - 1]);
      }
      return str;
    },

    _getSuggestedTileExplanation() {
      let targetedName = `<strong> ${this.link.targetedName} </strong>`;
      let targetedSite = `<strong> ${this.link.targetedSite} </strong>`;
      if (this.link.explanation) {
        return this._newTabString(
          this.link.explanation, [targetedName, targetedSite]
        );
      }
      return gNewTab.newTabString("suggested.button", [targetedName]);
    },

    /**
     * Checks for and modifies link at campaign end time
     */
    _checkLinkEndTime() {
      if (this.link.endTime && this.link.endTime < Date.now()) {
        let oldUrl = this.url;
        // chop off the path part from url
        this.link.url = new URL(this.url).origin + "/";
        // clear supplied images - this triggers thumbnail download for new url
        delete this.link.imageURI;
        delete this.link.enhancedImageURI;
        // remove endTime to avoid further time checks
        delete this.link.endTime;
        // clear enhanced-content image that may still exist in preloaded page
        this._querySelector(".enhanced-content").style.backgroundImage = "";
        gNewTab.sendToBrowser("NewTab:ReplacePinLink", {
          oldUrl, link: this.link
        });
      }
    },

    /**
     * Renders the site's data (fills the HTML fragment).
     */
    _render() {
      // first check for end time, as it may modify the link
      this._checkLinkEndTime();
      // setup display variables
      let enhanced = this.link;
      let url = this.url;

      let title = this.title;
      if (enhanced && enhanced.title && this._type === ENHANCED) {
        title = enhanced.title;
      } else if (this._type === REGULAR) {
        title = this.link.baseDomain;
      }

      let tooltip = (this.title === url ? this.title : this.title + "\n" + url);

      let link = this._querySelector(".newtab-link");
      link.title = tooltip;
      link.href = url;
      this._querySelector(".newtab-title").textContent = title;
      this.node.dataset.type = this.link.type;

      if (this.link.targetedSite) {
        if (this.node.dataset.type !== "sponsored") {
          this._querySelector(".newtab-sponsored").textContent =
            gNewTab.newTabString("suggested.tag");
        }
        this.node.dataset.suggested = true;
        let explanation = this._getSuggestedTileExplanation();
        this._querySelector(".newtab-suggested").innerHTML =
          `<div class='newtab-suggested-bounds'> ${explanation} </div>`;
      }

      if (this.isPinned()) {
        this._updateAttributes(true);
      }
      // Capture the page if the thumbnail is missing, which will cause page.js
      // to be notified and call our refreshThumbnail() method.
      this.captureIfMissing();
      // but still display whatever thumbnail might be available now.
      this.refreshThumbnail();
    },

    /**
     * Called when the site's tab becomes visible for the first time.
     * Since the newtab may be preloaded long before it's displayed,
     * check for changed conditions and re-render if needed
     */
    onFirstVisible() {
      if (this.link.endTime && this.link.endTime < Date.now()) {
        // site needs to change landing url and background image
        this._render();
      } else {
        this.captureIfMissing();
      }
    },

    /**
     * Captures the site's thumbnail in the background, but only if there's no
     * existing thumbnail and the page allows background captures.
     */
    captureIfMissing() {
      if (!document.hidden && !this.link.imageURI) {
        gNewTab.sendToBrowser("NewTab:BackgroundPageThumbs", {
          url: this.url
        });
      }
    },

    /**
     * Refreshes the thumbnail for the site.
     */
    refreshThumbnail() {
      gNewTab.sendToBrowser("NewTab:PageThumbs", {
        link: this.link
      });
    },

    /**
     * Render the correct thumbnail for the site.
     *
     * @param {Object} aData Contains enhanced links and the URI generated from the
     *        current URL.
     */
    getURI(aData) {
      let thumbnail = this._querySelector(".newtab-thumbnail");
      if (this.link.bgColor) {
        thumbnail.style.backgroundColor = this.link.bgColor;
      }

      let uri = this.link.imageURI || aData.uri;
      thumbnail.style.backgroundImage = `url("${uri}")`;

      if (this.link.enhancedImageURI) {
        let enhanced = this._querySelector(".enhanced-content");
        enhanced.style.backgroundImage = `url("${this.link.enhancedImageURI}")`;

        if (this.link.type !== this.link.type) {
          this.node.dataset.type = "enhanced";
          this.enhancedId = this.link.directoryId;
        }
      }
    },

    _ignoreHoverEvents(element) {
      element.addEventListener("mouseover", () => {
        this.cell.node.dataset.ignoreHover = true;
      });
      element.addEventListener("mouseout", () => {
        this.cell.node.dataset.ignoreHover = false;
      });
    },

    /**
     * Adds event handlers for the site and its buttons.
     */
    _addEventHandlers() {
      // Register drag-and-drop event handlers.
      this._node.addEventListener("dragstart", this, false);
      this._node.addEventListener("dragend", this, false);
      this._node.addEventListener("mouseover", this, false);

      // Specially treat the sponsored icon & suggested explanation
      // text to prevent regular hover effects
      let sponsored = this._querySelector(".newtab-sponsored");
      let suggested = this._querySelector(".newtab-suggested");
      this._ignoreHoverEvents(sponsored);
      this._ignoreHoverEvents(suggested);
    },

    _toggleLegalText(buttonClass, explanationTextClass) {
      let button = this._querySelector(buttonClass);
      if (!button.dataset.active) {
        let explain = this._querySelector(explanationTextClass);
        explain.parentNode.removeChild(explain);

        button.dataset.active = false;
      } else {
        let explain = document.createElement("div");
        explain.className = explanationTextClass.slice(1); // Slice off the first character, '.'
        this.node.appendChild(explain);

        let link = `
          <a href="${TILES_EXPLAIN_LINK}">
            ${gNewTab.newTabString("learn.link")}
          </a>`;
        let linkType = this.node.dataset.type;
        let isAffiliate = linkType === "affiliate";
        let isSuggested = this.node.dataset.suggested;
        let type = (isSuggested && isAffiliate) ? "suggested" : linkType;
        let tabClass = (type === "enhanced") ? "customize" : "control-block";
        let icon = `<input type="button"
                      class="newtab-control newtab-${tabClass}">`;
        explain.innerHTML = gNewTab.newTabString(
          type + (type === "sponsored" ? ".explain2" : ".explain"), [icon, link]
        );

        button.dataset.active = true;
      }
    },

    /**
     * Handles site click events.
     */
    onClick(aEvent) {
      let action;
      let pinned = this.isPinned();
      let tileIndex = this.cell.index;
      let {
        button, target
      } = aEvent;

      // Handle tile/thumbnail link click
      if (target.classList.contains("newtab-link") ||
        target.parentElement.classList.contains("newtab-link")) {
        // Record for primary and middle clicks
        if (button === 0 || button === 1) {
          gNewTab.sendToBrowser("NewTab:RecordSiteClicked", {
            index: tileIndex
          });
          action = "click";
        }
        // Handle sponsored explanation link click
      } else if (target.parentElement.classList.contains("sponsored-explain")) {
        action = "sponsored_link";
      } else if (target.parentElement.classList.contains("suggested-explain")) {
        action = "suggested_link";
        // Only handle primary clicks for the remaining targets
      } else if (button === 0) {
        aEvent.preventDefault();
        if (target.classList.contains("newtab-control-block")) {
          this.block();
          action = "block";
        } else if (target.classList.contains("sponsored-explain") ||
          target.classList.contains("newtab-sponsored")) {
          this._toggleLegalText(".newtab-sponsored", ".sponsored-explain");
          action = "sponsored";
        } else if (pinned && target.classList.contains("newtab-control-pin")) {
          this.unpin();
          action = "unpin";
        } else if (!pinned && target.classList.contains("newtab-control-pin")) {
          this.pin();
          action = "pin";
        }
      }

      // Report all link click actions
      if (action) {
        gNewTab.sendToBrowser("NewTab:ReportSitesAction", {
          sites: gNewTab.stringifySites(gGrid.sites),
          action: action,
          index: tileIndex
        });
      }
    },

    /**
     * Handles all site events.
     */
    handleEvent(aEvent) {
      switch (aEvent.type) {
      case "mouseover":
        this._node.removeEventListener("mouseover", this, false);
        gNewTab.sendToBrowser("NewTab:SpeculativeConnect", {
          url: this.url
        });
        break;
      case "dragstart":
        gDrag.start(this, aEvent);
        break;
      case "dragend":
        gDrag.end(this, aEvent);
        break;
      }
    }
  };
  exports.Site = Site;
}(window));
