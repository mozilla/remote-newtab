/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals ContentSearchUIController*/
"use strict";
(function(exports) {
  let gSearch = {

    _contentSearchController: null,

    init() {
      let textbox = document.getElementById("newtab-search-text");
      this._contentSearchController =
        new ContentSearchUIController(textbox, textbox.parentNode, "newtab", "newtab");
      document.getElementById("newtab-search-submit")
        .addEventListener("click", e => this._contentSearchController.search(e));
    },
  };
  exports.gSearch = gSearch;
}(window));
