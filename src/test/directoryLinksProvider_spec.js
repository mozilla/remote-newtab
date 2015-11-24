/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

describe("DirectoryLinksProvider API", function() {
  "use strict";

  let directoryLinks = {
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
      }]
  };

  it("should populate suggested and directory links", async(function*() {
    yield ProviderManager.init("test/directoryLinksNoAdgroup.json");
    assert.equal(DirectoryLinksProvider._observers.size, 1);

    let links = yield DirectoryLinksProvider.getLinks();

    // Suggested tile wasn't parsed because it's missing adgroup_name.
    assert.equal(DirectoryLinksProvider._suggestedLinks.size, 0);

    // Include adgroup_name and make sure suggested tile is cached.
    yield DirectoryLinksProvider.init("test/directoryLinksWithAdgroup.json");
    links = yield DirectoryLinksProvider.getLinks();

    // There are 4 frecent sites.
    assert.equal(DirectoryLinksProvider._suggestedLinks.size, 5);

    // There are 2 directory links.
    assert.equal(links.length, 2);
    for (let i = 0; i < links.length; i++) {
      let expectedLink = directoryLinks.directory[i];
      let givenLink = links[i];

      assert.equal(givenLink.title, expectedLink.title);
      assert.equal(givenLink.id, expectedLink.id);
    }

    // Re-initing ProviderManager should not re-add observers.
    yield ProviderManager.init("test/directoryLinksWithAdgroup.json");
    assert.equal(DirectoryLinksProvider._observers.size, 1);
  }));

  it("should escape chars", function() {
    assert.equal("&lt;test&gt;", DirectoryLinksProvider._escapeChars("<test>"));
  });
});
