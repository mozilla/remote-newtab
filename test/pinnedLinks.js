/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals gPinnedLinks, gUserDatabase */

describe("Pinned Links API", function() {
  "use strict";

  var firstLink = {url: "http://example0.com/", title: "site#0"};
  var secondLink = {url: "http://example1.com/", title: "site#1"};
  var directoryLink = {url: "http://directorylink.com", title: "DirectoryLink", type: "affiliate"};

  const gMockObject = {
    open() {
      return this.generateFaultyRequest("Attempting to open user DB");
    },

    get() {
      return this.generateFaultyRequest("Attempting to save user DB");
    },

    generateFaultyRequest(errorCode) {
      var request = {};
      setTimeout(() => {
        request.onerror({target: {errorCode}});
      }, 0);
      return request;
    }
  };

  afterEach(function(done) {
    // Clear the database and cached links.
    gPinnedLinks.resetCache();
    gUserDatabase.init(["pinnedLinks"]).then(() => {
      gPinnedLinks.initPinnedLinks().then(() => {
        gUserDatabase.save("prefs", "pinnedLinks", []).then(() => {
          gUserDatabase.close();
          done();
        });
      });
    });
  });

  it("should be empty initially", () => {
    var links = gPinnedLinks.links;
    assert.equal(links.length, 0);
  });

  it("should update the database and links", () => {
    return gUserDatabase.init(["pinnedLinks"]).then(() => {
      gPinnedLinks.initPinnedLinks().then(() => {
        assert.lengthOf(gPinnedLinks.links, 0);

        gPinnedLinks.pin(firstLink, 2);
        return gUserDatabase.load("prefs", "pinnedLinks").then(pinnedLinks => {
          var storedPinnedLinks = JSON.stringify([null, null, firstLink]);
          assert.equal(pinnedLinks, storedPinnedLinks);
          assert.equal(JSON.stringify(gPinnedLinks.links), storedPinnedLinks);
        });
      });
    });
  });

  it("should update the database and links", () => {
    return gUserDatabase.init(["pinnedLinks"]).then(() => {
      gPinnedLinks.initPinnedLinks().then(() => {
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
  });

  it("should turn a directory link into history", () => {
    return gUserDatabase.init(["pinnedLinks"]).then(() => {
      gPinnedLinks.initPinnedLinks().then(() => {
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
  });

  it("should replace a pinned link with another (Used for ended campaigns)", () => {
    return gUserDatabase.init(["pinnedLinks"]).then(() => {
      gPinnedLinks.initPinnedLinks().then(() => {
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

  describe("gUserDatabase Errors", function() {
    it("should reject when there is an error opening the database", () => {
      var initPromise = gUserDatabase.init(["pinnedLinks"], gMockObject);
      return initPromise.should.be.rejected;
    });

    it("should reject when there is an error saving to the database", () => {
      gUserDatabase.init(["pinnedLinks"]).then(() => {
        var savePromise = gUserDatabase.save("prefs", "pinnedLinks", null, gMockObject);
        return savePromise.should.be.rejected;
      });
    });

    it("should reject when a simple request fails", () => {
      var simpleRequestHandlersPromise =
        gUserDatabase._setSimpleRequestHandlers(gMockObject.generateFaultyRequest("Simple Handler Error"),
        "This is a request handler error");
      return simpleRequestHandlersPromise.should.be.rejected;
    });
  });
});
