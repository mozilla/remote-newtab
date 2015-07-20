/**
 * Rect is a simple data structure for representation of a rectangle supporting
 * many basic geometric operations.
 *
 * NOTE: Since its operations are closed, rectangles may be empty and will report
 * non-positive widths and heights in that case.
 */
 
this.Rect = function Rect(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.right = x + w;
  this.bottom = y + h;
};

Rect.prototype = {
  get width() { return this.right - this.left; },
  get height() { return this.bottom - this.top; },
  set width(v) { this.right = this.left + v; },
  set height(v) { this.bottom = this.top + v; },

  isEmpty: function isEmpty() {
    return this.left >= this.right || this.top >= this.bottom;
  },

  clone: function clone() {
    return new Rect(this.left, this.top, this.right - this.left, this.bottom - this.top);
  },

  intersect: function(other) {
  	let clone = this.clone();
    return this.clone().restrictTo(other);
  },

  setRect: function(x, y, w, h) {
    this.left = x;
    this.top = y;
    this.right = x+w;
    this.bottom = y+h;

    return this;
  },

  /** Restrict area of this rectangle to the intersection of both rectangles. */
  restrictTo: function restrictTo(other) {
    if (this.isEmpty() || other.isEmpty())
      return this.setRect(0, 0, 0, 0);

    let x1 = Math.max(this.left, other.left);
    let x2 = Math.min(this.right, other.right);
    let y1 = Math.max(this.top, other.top);
    let y2 = Math.min(this.bottom, other.bottom);

    // If width or height is 0, the intersection was empty.
  	return this.setRect(x1, y1, Math.max(0, x2 - x1), Math.max(0, y2 - y1));
  },
}