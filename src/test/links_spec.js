/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

describe("Links API", function() {
  "use strict";

  var placesLinks = [
    {
      "title": "Test1",
      "type": "history",
      "url": "http://www.test1.com/",
      "frecency": 100,
      "lastVisitDate": Date.now()
    },
    {
      "title": "Test2",
      "type": "history",
      "url": "http://www.test2.com/",
      "frecency": 101,
      "lastVisitDate": Date.now()
    },
    {
      "title": "Test3",
      "type": "history",
      "url": "meep.www.test2.com/",
      "frecency": 102,
      "lastVisitDate": Date.now()
    }
  ];

  var firstLink = {url: "http://example0.com/", title: "site#0"};
  var secondLink = {url: "http://example1.com/", title: "site#1"};

  it("should populate cache and get links", async(function*() {
    yield gUserDatabase.init({"pinnedLinks": []});
    yield gPinnedLinks.init();
    yield ProviderManager.init("test/directoryLinksNoAdgroup.json");

    // There are 0 links before we populate
    var links = yield Links.getLinks();
    assert.equal(links.links.length, 0);

    PlacesProvider.setLinks(placesLinks);
    yield Links.populateCache();

    yield gPinnedLinks.pin(firstLink, 1);
    yield gPinnedLinks.pin(secondLink, 0);

    links = yield Links.getLinks();

    // There are 6 links: 2 directory, 2 places, and 2 pinned
    assert.equal(links.links.length, 6);

    // A forced cache populate should have the same results.
    yield Links.populateCache({force: true});
    links = yield Links.getLinks();
    assert.equal(links.links.length, 6);

    // Unpin links.
    yield gPinnedLinks.unpin(firstLink);
    yield gPinnedLinks.unpin(secondLink);
  }));

  it("should throw if links don't have required attributes", function() {
    expect(() => Links.compareLinks(firstLink, secondLink)).to.throw(Error);
  });

  it("should not increment site map for blocked links", function() {
    var m = new Map();
    gBlockedLinks.block(firstLink);
    Links._incrementSiteMap(m, firstLink);
    assert.equal(m.size, 0);
  });
});
