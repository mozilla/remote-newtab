/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gNewTab, TILES_INTRO_LINK*/
"use strict";
(function(exports) {
  const gCustomize = {
    _nodeIDSuffixes: [
      "blank",
      "button",
      "classic",
      "enhanced",
      "panel",
      "overlay",
      "learn"
    ],

    _nodes: {},

    init() {
      for (let idSuffix of this._nodeIDSuffixes) {
        let selector = "newtab-customize-" + idSuffix;
        this._nodes[idSuffix] = document.getElementById(selector);
      }

      this._nodes.button.addEventListener("click", e => this.showPanel(e));
      this._nodes.blank.addEventListener("click", this);
      this._nodes.classic.addEventListener("click", this);
      this._nodes.enhanced.addEventListener("click", this);
      this._nodes.learn.addEventListener("click", this);
      this.updateSelected();
    },

    hidePanel() {
      this._nodes.overlay.addEventListener("transitionend", function end() {
        gCustomize._nodes.overlay.removeEventListener("transitionend", end);
        gCustomize._nodes.overlay.style.display = "none";
      });
      this._nodes.overlay.style.opacity = 0;
      delete this._nodes.button.data.active;
      delete this._nodes.panel.data.open;
      document.removeEventListener("click", this);
      document.removeEventListener("keydown", this);
    },

    showPanel(event) {
      if (this._nodes.panel.getAttribute("data-open") === "true") {
        return;
      }

      let {
        panel, button, overlay
      } = this._nodes;
      overlay.style.display = "block";
      panel.data.open = true;
      button.data.active = true;
      setTimeout(() => {
        // Wait for display update to take place, then animate.
        overlay.style.opacity = 0.8;
      }, 0);

      document.addEventListener("click", this);
      document.addEventListener("keydown", this);

      // Stop the event propogation to prevent panel from immediately closing
      // via the document click event that we just added.
      event.stopPropagation();
    },

    handleEvent(event) {
      switch (event.type) {
      case "click":
        this.onClick(event);
        break;
      case "keydown":
        this.onKeyDown(event);
        break;
      }
    },

    onClick(event) {
      if (event.currentTarget === document) {
        if (!this._nodes.panel.contains(event.target)) {
          this.hidePanel();
        }
      }
      switch (event.currentTarget.id) {
      case "newtab-customize-blank":
        gNewTab.sendToBrowser("NewTab:Customize", {
          enabled: false
        });
        break;
      case "newtab-customize-classic":
        if (this._nodes.enhanced.getAttribute("data-selected")) {
          gNewTab.sendToBrowser("NewTab:Customize", {
            enabled: true,
            enhanced: true
          });
        } else {
          gNewTab.sendToBrowser("NewTab:Customize", {
            enabled: true,
            enhanced: false
          });
        }
        break;
      case "newtab-customize-enhanced":
        gNewTab.sendToBrowser("NewTab:Customize", {
          enabled: true,
          enhanced: !gNewTab.enhanced
        });
        break;
      case "newtab-customize-learn":
        this.showLearn();
        break;
      }
    },

    onKeyDown(event) {
      if (event.keyCode === event.DOM_VK_ESCAPE) {
        this.hidePanel();
      }
    },

    showLearn() {
      window.open(TILES_INTRO_LINK, "new_window");
      this.hidePanel();
    },

    updateSelected() {
      if (!this._nodes || Object.keys(this._nodes).length === 0) {
        // Cannot update nodes that do not yet exist. We might get here when
        // we receive the values for 'enabled' and 'enhanced' for the first time
        // but have not yet initialized the page.
        return;
      }

      let selected = gNewTab.enabled ?
        gNewTab.enhanced ? "enhanced" : "classic" : "blank";
      ["enhanced", "classic", "blank"].forEach(id => {
        let node = this._nodes[id];
        if (id === selected) {
          node.data.selected = true;
        } else {
          delete node.data.selected;
        }
      });
      if (selected === "enhanced") {
        // If enhanced is selected, so is classic (since enhanced is a subitem
        // of classic)
        this._nodes.classic.data.selected = true;
      }
    },
  };
  exports.gCustomize = gCustomize;
}(window));
