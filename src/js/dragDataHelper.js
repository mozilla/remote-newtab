/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
(function(exports) {
  const gDragDataHelper = {
    get mimeType() {
      return "text/x-moz-url";
    },

    getLinkFromDragEvent(aEvent) {
      let dt = aEvent.dataTransfer;
      if (!dt || !dt.types.contains(this.mimeType)) {
        return null;
      }

      let data = dt.getData(this.mimeType) || "";
      let [url, title] = data.split(/[\r\n]+/);
      return {
        url, title
      };
    }
  };
  exports.gDragDataHelper = gDragDataHelper;
}(window));
