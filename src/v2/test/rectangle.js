/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global assert, expect*/
"use strict";

describe("Rect class", () => {

  describe("Exposed correctly", () => {
    it("should be present on window object", () => {
      assert.equal(!!(window.Rectangle), true);
    });
    it("should be a function.", () => {
      assert.equal(typeof window.Rectangle === "function", true);
    });
    it("should be constructible.", () => {
      var rect = new window.Rectangle(0, 0, 0, 0);
      expect(rect).to.be.an.instanceof(window.Rectangle);
    });
  });

  describe("Creating a rectangle", () => {
    it("should throw when constructor arguments result in NaN.", () => {
      var builder = function() {
        new window.Rectangle(...arguments);
      };
      expect(() => {
        builder();
      }).to.throw(TypeError);
      expect(() => {
        builder("one");
      }).to.throw(TypeError);
      expect(() => {
        builder(1, "two", 3, 4);
      }).to.throw(TypeError);
      expect(() => {
        builder(1, 2, "three", 4);
      }).to.throw(TypeError);
      expect(() => {
        builder(1, 2, 3, "four");
      }).to.throw(TypeError);
    });
    it("should have attributes whose types are numbers.", () => {
      var rect = new window.Rectangle(1, 1, 10, 10);
      assert.typeOf(rect.left, "number");
      assert.typeOf(rect.top, "number");
      assert.typeOf(rect.bottom, "number");
      assert.typeOf(rect.right, "number");
    });
    it("should have its properties set correctly.", () => {
      var rect = new window.Rectangle(5, 10, 10, 20);
      expect(rect.left).to.equal(5);
      expect(rect.top).to.equal(10);
      expect(rect.right).to.equal(15);
      expect(rect.bottom).to.equal(30);
    });
    it("should parse strings correctly.", () => {
      var rect = new window.Rectangle(" 5 ", " \n 10 \t\t", "10", "\t20");
      expect(rect.left).to.equal(5);
      expect(rect.left).to.be.a("number");
      expect(rect.top).to.equal(10);
      expect(rect.top).to.be.a("number");
      expect(rect.right).to.equal(15);
      expect(rect.right).to.be.a("number");
      expect(rect.bottom).to.equal(30);
      expect(rect.bottom).to.be.a("number");
    });
  });

  describe("Cloning", () => {
    var rect = new window.Rectangle(0, 0, 10, 10);
    var clone = rect.clone();
    it("should result in different objects.", () => {
      expect(rect === clone).to.equal(false);
    });
    it("should have the same property values", () => {
      expect(clone).to.have.property("width", rect.width);
      expect(clone).to.have.property("height", rect.height);
      expect(clone).to.have.property("top", rect.top);
      expect(clone).to.have.property("bottom", rect.bottom);
      expect(clone).to.have.property("left", rect.left);
      expect(clone).to.have.property("right", rect.right);
    });
  });

  describe("Intersect and restrict", ()=> {
    it("should result in an empty rectangle after intersection.", ()=> {
      var emptyA = new window.Rectangle(0, 0, 0, 0);
      var b = new window.Rectangle(0, 0, 10, 10);
      var intersected = b.intersect(emptyA);
      expect(intersected.isEmpty).to.equal(true);
    });
    it("it should restrict a to b", ()=> {
      var a = new window.Rectangle(0, 0, 100, 100);
      var b = new window.Rectangle(10, 10, 50, 50);
      a.restrictTo(b);
      expect(a).to.have.property("left", 10);
      expect(a).to.have.property("top", 10);
      expect(a).to.have.property("right", 60);
      expect(a).to.have.property("bottom", 60);
    });
  });

  describe("Getters and setters", () => {
    var rect = new window.Rectangle(0, 0, 10, 20);
    it("should return the width.", () => {
      expect(rect.width).to.equal(10);
    });
    it("should return the height.", () => {
      expect(rect.height).to.equal(20);
    });
    it("should throw if setting the width to a NaN.", () => {
      expect(() => {
        rect.width = "not a number";
      }).to.throw(TypeError);
    });
    it("should throw if setting the height to a NaN.", () => {
      expect(() => {
        rect.height = "not a number";
      }).to.throw(TypeError);
    });
    it("should set the width.", () => {
      rect.width = 32;
      expect(rect.width).to.equal(32);
    });
    it("should set the height.", () => {
      rect.height = 32;
      expect(rect.height).to.equal(32);
    });
    it("should not be empty.", () => {
      assert.equal(rect.isEmpty, false);
    });
    it("should become empty.", () => {
      rect.setRect(0, 0, 0, 0);
      assert.equal(rect.isEmpty, true);
      rect.setRect(0, 0, -10, -10);
      assert.equal(rect.isEmpty, true);
    });
  });
});
