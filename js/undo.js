/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gNewTab, gUpdater */

"use strict";
(function(exports) {
  /**
   * Dialog allowing to undo the removal of single site or to completely restore
   * the grid's original state.
   */
  const gUndoDialog = {
    /**
     * The undo dialog's timeout in miliseconds.
     */
    HIDE_TIMEOUT_MS: 15000,

    /**
     * Contains undo information.
     */
    _undoData: null,

    /**
     * Initializes the undo dialog.
     */
    init() {
      // Alias QuerySelector to reduce line length
      let qs = document.querySelector.bind(document);
      this._undoContainer = qs("#newtab-undo-container");
      this._undoContainer.addEventListener("click", this, false);
      this._undoButton = qs("#newtab-undo-button");
      this._undoCloseButton = qs("#newtab-undo-close-button");
      this._undoRestoreButton = qs("#newtab-undo-restore-button");
      gNewTab.registerListener("NewTab:Restore", this._restore.bind(this));
    },

    /**
     * Shows the undo dialog.
     *
     * @param {Site} aSite The site that just got removed.
     */
    show(aSite) {
      if (this._undoData) {
        clearTimeout(this._undoData.timeout);
      }

      this._undoData = {
        index: aSite.cell.index,
        wasPinned: aSite.isPinned(),
        blockedLink: aSite.link,
        timeout: setTimeout(this.hide.bind(this), this.HIDE_TIMEOUT_MS)
      };

      this._undoContainer.removeAttribute("undo-disabled");
      this._undoButton.removeAttribute("tabindex");
      this._undoCloseButton.removeAttribute("tabindex");
      this._undoRestoreButton.removeAttribute("tabindex");
    },

    /**
     * Hides the undo dialog.
     */
    hide() {
      if (!this._undoData) {
        return;
      }

      clearTimeout(this._undoData.timeout);
      this._undoData = null;
      this._undoContainer.setAttribute("undo-disabled", "true");
      this._undoButton.setAttribute("tabindex", "-1");
      this._undoCloseButton.setAttribute("tabindex", "-1");
      this._undoRestoreButton.setAttribute("tabindex", "-1");
    },

    /**
     * The undo dialog event handler.
     *
     * @param {Event} aEvent The event to handle.
     */
    handleEvent(aEvent) {
      switch (aEvent.target.id) {
      case "newtab-undo-button":
        this._undo();
        break;
      case "newtab-undo-restore-button":
        this._undoAll();
        break;
      case "newtab-undo-close-button":
        this.hide();
        break;
      }
    },

    /**
     * Undo the last blocked site.
     */
    _undo() {
      if (!this._undoData) {
        return;
      }

      let {
        index, wasPinned, blockedLink
      } = this._undoData;
      gNewTab.sendToBrowser("NewTab:UnblockLink", {
        link: blockedLink,
        wasPinned,
        index
      });
      this._restore();
    },

    /**
     * Undo all blocked sites.
     */
    _undoAll() {
      gNewTab.sendToBrowser("NewTab:UndoAll");
    },

    /**
     * Restore the state of the page and hide the undo dialog.
     */
    _restore() {
      gUpdater.sendUpdate();
      this.hide();
    },
  };

  gUndoDialog.init();
  exports.gUndoDialog = gUndoDialog;
}(window));
