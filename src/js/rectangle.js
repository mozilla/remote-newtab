/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */

"use strict";

(function(exports) {
  function Rectangle(x, y, w, h) {
    this.setRect(x, y, w, h);
  }

  Rectangle.prototype = {
    get width() {
      return this.right - this.left;
    },
    get height() {
      return this.bottom - this.top;
    },
    set width(v) {
      this.right = this.left + coerceToNumber(v);
    },
    set height(v) {
      this.bottom = this.top + coerceToNumber(v);
    },
    get isEmpty() {
      return this.left >= this.right || this.top >= this.bottom;
    },

    clone() {
      return new Rectangle(this.left, this.top, this.width, this.height);
    },

    intersect(other) {
      return this.clone().restrictTo(other);
    },

    setRect(x, y, w, h) {
      this.left = coerceToNumber(x);
      this.top = coerceToNumber(y);
      this.right = this.left + coerceToNumber(w);
      this.bottom = this.top + coerceToNumber(h);
      return this;
    },

    // Restrict area of this rectangle to the intersection of both rectangles.
    restrictTo(other) {
      if (this.isEmpty || other.isEmpty) {
        return this.setRect(0, 0, 0, 0);
      }

      const x1 = Math.max(this.left, other.left);
      const x2 = Math.min(this.right, other.right);
      const y1 = Math.max(this.top, other.top);
      const y2 = Math.min(this.bottom, other.bottom);

      // If width or height is 0, the intersection was empty.
      return this.setRect(x1, y1, Math.max(0, x2 - x1), Math.max(0, y2 - y1));
    },
  };

  function coerceToNumber(v) {
    var num = Number.parseInt(v, 10);
    if (Number.isNaN(num)) {
      throw new TypeError("Expected number.");
    }
    return num;
  }
  exports.Rectangle = Rectangle;
}(window));
