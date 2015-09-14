/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gPinnedLinks, gUserDatabase */

describe("Pinned Links API", () => {
  "use strict";

  var firstLink = {url: "http://example0.com/", title: "site#0"};
  var secondLink = {url: "http://example1.com/", title: "site#1"};
  var directoryLink = {url: "http://directorylink.com", title: "DirectoryLink", type: "affiliate"};

  var linksToSet = JSON.stringify([
    firstLink, secondLink,
    {url: "http://example2.com/", title: "site#2"},
    {url: "http://example3.com/", title: "site#3"},
    {url: "http://example4.com/", title: "site#4"}
  ]);

  afterEach(function(done) {
    // Clear the database and cached links.
    gPinnedLinks.resetCache();
    gUserDatabase.init(gPinnedLinks.setLinks).then(() => {
      gUserDatabase.save("prefs", "pinnedLinks", []).then(() => {
        gUserDatabase.close();
        done();
      });
    });
  });

  it("Links should be null initially", () => {
    var links = gPinnedLinks.links;
    assert.equal(links, null);
  });

  it("Setting links to empty array", () => {
    gPinnedLinks.setLinks([]);
    var links = gPinnedLinks.links;
    assert.lengthOf(links, 0);
  });

  it("Setting links to non-empty array", () => {
    gPinnedLinks.setLinks(linksToSet);
    assert.lengthOf(gPinnedLinks.links, JSON.parse(linksToSet).length);
    for (var i = 0; i < gPinnedLinks.links.length; i++) {
      assert.equal(gPinnedLinks.links[i].url, "http://example" + i + ".com/");
      assert.equal(gPinnedLinks.links[i].title, "site#" + i);
    }
  });

  it("Pinning a link updates the database and links", () => {
    return gUserDatabase.init().then(pinnedLinks => {
      gPinnedLinks.setLinks(pinnedLinks);
      assert.lengthOf(gPinnedLinks.links, 0);

      gPinnedLinks.pin(firstLink, 2);
      return gUserDatabase.load("prefs", "pinnedLinks").then(pinnedLinks => {
        var storedPinnedLinks = JSON.stringify([null, null, firstLink]);
        assert.equal(pinnedLinks, storedPinnedLinks);
        assert.equal(JSON.stringify(gPinnedLinks.links), storedPinnedLinks);
      });
    });
  });

  it("Unpinning a link updates the database and links", () => {
    return gUserDatabase.init().then(pinnedLinks => {
      gPinnedLinks.setLinks(pinnedLinks);
      assert.lengthOf(gPinnedLinks.links, 0);

      gPinnedLinks.pin(firstLink, 2);
      gPinnedLinks.pin(secondLink, 1);
      assert.isTrue(gPinnedLinks.isPinned(firstLink));
      assert.isTrue(gPinnedLinks.isPinned(secondLink));

      gPinnedLinks.unpin(firstLink);
      assert.isFalse(gPinnedLinks.isPinned(firstLink));

      gPinnedLinks.pin(firstLink, 5);

      return gUserDatabase.load("prefs", "pinnedLinks").then(pinnedLinks => {
        var storedPinnedLinks = JSON.stringify([null, secondLink, null, null, null, firstLink]);
        assert.equal(pinnedLinks, storedPinnedLinks);
        assert.equal(JSON.stringify(gPinnedLinks.links), storedPinnedLinks);
      });
    });
  });

  it("Pinning a directory link turns it to history", () => {
    return gUserDatabase.init().then(pinnedLinks => {
      gPinnedLinks.setLinks(pinnedLinks);
      assert.lengthOf(gPinnedLinks.links, 0);

      gPinnedLinks.pin(directoryLink, 2);
      return gUserDatabase.load("prefs", "pinnedLinks").then(pinnedLinks => {
        var storedPinnedLinks = JSON.stringify([null, null, directoryLink]);
        assert.equal(pinnedLinks, storedPinnedLinks);
        assert.equal(JSON.stringify(gPinnedLinks.links), storedPinnedLinks);
        assert.equal(directoryLink.type, "history");
      });
    });
  });

  it("Test replacing a pinned link with another (Used for ended campaigns)", () => {
    return gUserDatabase.init().then(pinnedLinks => {
      gPinnedLinks.setLinks(pinnedLinks);

      // Attempting to replace a link that isn't pinned does nothing.
      gPinnedLinks.replace("http://example0.com/", secondLink);
      assert.lengthOf(gPinnedLinks.links, 0);

      // Pin firstLink
      gPinnedLinks.pin(firstLink, 2);
      assert.equal(gPinnedLinks.links[2], firstLink);

      // Replace the pinned firstLink with secondLink
      gPinnedLinks.replace(firstLink.url, secondLink);
      assert.equal(gPinnedLinks.links[2], secondLink);
    });
  });
});
