/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals ContentSearchUIController*/
"use strict";
(function(exports) {
  debugger;
  let gSearch = {
    init() {
      let textbox = document.getElementById("newtab-search-text");
      this._contentSearchController =
        new ContentSearchUIController(textbox, textbox.parentNode, "newtab", "newtab");
      document.getElementById("newtab-search-submit")
        .addEventListener("click", this._contentSearchController.search.bind(this));
    },
  };
  exports.gSearch = gSearch;
}(window));
