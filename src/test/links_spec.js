/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

describe("Links API", function() {
  "use strict";

  var directoryLinks = {
    "directory": [{
        "directoryId": 1,
        "title": "Mozilla Community",
        "type": "affiliate",
        "url": "http://contribute.mozilla.org/"
      }, {
        "directoryId": 2,
        "title": "Private Browsing with Tracking Protection",
        "type": "affiliate",
        "url": "https://www.mozilla.org/firefox/private-browsing/?utm_source=" +
          "directory-tiles&utm_medium=tiles&utm_content=TPV1&utm_campaign=fx-fall-15"
      }],
    "suggested": [{
        "directoryId": 1,
        "imageURI": "https://dtex4kvbppovt.cloudfront.net/images/" +
          "f6a535cf622b97db63f4f7cdc11ac7cd7e2120f3.8723.png",
        "enhancedImageURI": "https://dtex4kvbppovt.cloudfront.net/images/" +
          "7c1c7a47346b9496b92d2191f38820684c54e3e4.8640.png",
        "frecent_sites": [
          "chat.com",
          "fring.com",
          "hello.firefox.com",
          "oovoo.com",
          "viber.com"
        ],
        "title": "TurboTax Suggest!",
        "type": "sponsored",
        "url": "https://turbotax.intuit.com/lp/ty14/bn/tmp_1_hp.jsp?znM=mind3?cid=" +
          "bn_moz_12_hp_1855513_114761141_56708720&cvosrc=display.1855513.114761141&m_field9=nt&m_field10=56708720&",
        "explanation": "Suggested for %1$S enthusiasts who visit sites like %2$S"
      }]
  };

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
    }
  ];

  const gMockCacheTasks = {
    update() {
      return {text: function() { return Promise.resolve(JSON.stringify(directoryLinks)); }};
    }
  };

  var firstLink = {url: "http://example0.com/", title: "site#0"};
  var secondLink = {url: "http://example1.com/", title: "site#1"};

  it("should populate cache and get links", async(function*() {
    // Save original CacheTasks functions and update them with mock functions.
    var tmpUpdate = CacheTasks.update;
    CacheTasks.update = gMockCacheTasks.update;

    yield gUserDatabase.init({"pinnedLinks": []});
    yield gPinnedLinks.init();
    yield ProviderManager.init();

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

    // Unpin links.
    yield gPinnedLinks.unpin(firstLink);
    yield gPinnedLinks.unpin(secondLink);

    // Returning to original functions of CacheTasks
    CacheTasks.update = tmpUpdate;
  }));
});
