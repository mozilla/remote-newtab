/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

describe("Blocked Links API", function() {
  "use strict";

  var firstLink = {url: "http://example0.com/", title: "site#0"};
  var secondLink = {url: "http://example1.com/", title: "site#1"};
  var thirdLink = {url: "http://example2.com/", title: "site#2"};

  afterEach(function(done) {
    // Clear the database and cached links.
    return gUserDatabase.init({"blockedLinks": [], "pinnedLinks": []})
      .then(gBlockedLinks.init)
      .then(gBlockedLinks.reset)
      .then(() => {
        gUserDatabase.close();
        done();
      });
  });

  it("should be empty initially", () => {
    var links = gBlockedLinks._links;
    assert.equal(links.size, 0);
  });

  it("should update the database and links", () => {
    return gUserDatabase.init({"blockedLinks": []}).then(() => {
      return gBlockedLinks.init().then(() => {
        assert.isTrue(gBlockedLinks.isEmpty());

        gBlockedLinks.block(firstLink);
        gBlockedLinks.block(secondLink);
        gBlockedLinks.block(thirdLink);
        gBlockedLinks.unblock(secondLink);

        return gUserDatabase.load("prefs", "blockedLinks").then(blockedLinks => {
          var storedBlockedLinks = JSON.stringify([firstLink.url, thirdLink.url]);
          assert.equal(blockedLinks, storedBlockedLinks);
          assert.equal(JSON.stringify([...gBlockedLinks._links]), storedBlockedLinks);
        });
      });
    });
  });

  it("should have no impact when attempting to unblock a link that isn't blocked", () => {
    return gUserDatabase.init({"blockedLinks": []}).then(() => {
      gBlockedLinks.init().then(() => {
        gBlockedLinks.unblock(secondLink);
        assert.isTrue(gBlockedLinks.isEmpty());
      });
    });
  });
});
