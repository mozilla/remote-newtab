/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* jshint node:true, esnext:true */
"use strict";

const TileUtils = require("lib/TileUtils");
const assert = require("chai").assert;

describe("TileUtils", function() {
  var firstLink = {url: "http://example0.com/", title: "site#0", frecency: 1, lastVisitDate: 1};
  var secondLink = {url: "http://example1.com/", title: "site#1", frecency: 3, lastVisitDate: 1};
  var thirdLink = {url: "http://example2.com/", title: "site#2", frecency: 3, lastVisitDate: 1};

  it("should merge links", () => {
    var merged = JSON.stringify(TileUtils.getMergedLinks([[firstLink, thirdLink], [secondLink]]));
    assert.equal(merged, JSON.stringify([secondLink, thirdLink, firstLink]));
  });

});
