/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

describe("DirectoryLinksProvider API", function() {
  "use strict";

  const gMockCacheTasks = {
    update() {
      return {json: function() { return Promise.resolve(directoryLinks); }};
    }
  };

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

  it("should populate suggested and directory links", async(function*() {
    // Save original CacheTasks functions and update them with mock functions.
    var tmpUpdate = CacheTasks.update;
    CacheTasks.update = gMockCacheTasks.update;

    yield ProviderManager.init();
    assert.equal(DirectoryLinksProvider._observers.size, 1);

    var links = yield DirectoryLinksProvider.getLinks();

    // Suggested tile wasn't parsed because it's missing adgroup_name.
    assert.equal(DirectoryLinksProvider._suggestedLinks.size, 0);

    // Add adgroup_name and make sure suggested tile is cached.
    //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    directoryLinks.suggested[0].adgroup_name = "Technology";
    //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
    yield DirectoryLinksProvider.init();
    links = yield DirectoryLinksProvider.getLinks();

    // There are 4 frecent sites.
    assert.equal(DirectoryLinksProvider._suggestedLinks.size, 5);

    // There are 2 directory links.
    assert.equal(links.length, 2);
    for (var i = 0; i < links.length; i++) {
      var expectedLink = directoryLinks.directory[i];
      var givenLink = links[i];

      assert.equal(givenLink.title, expectedLink.title);
      assert.equal(givenLink.id, expectedLink.id);
    }

    // Re-initing ProviderManager should not re-add observers.
    yield ProviderManager.init();
    assert.equal(DirectoryLinksProvider._observers.size, 1);

    // Returning to original functions of CacheTasks
    CacheTasks.update = tmpUpdate;
  }));
});
