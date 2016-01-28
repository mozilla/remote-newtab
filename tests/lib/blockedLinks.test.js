/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* jshint node:true, esnext:true */

const gBlockedLinks = require("lib/blockedLinks");
const gUserDatabase = require("lib/userDatabase");
const async = require("lib/async");
const assert = require("chai").assert;

describe("Blocked Links API", function() {
  "use strict";

  var firstLink = "http://example0.com/";
  var secondLink = "http://example1.com/";
  var thirdLink = "http://example2.com/";

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
          var storedBlockedLinks = JSON.stringify([firstLink, thirdLink]);
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

  describe("gUserDatabase Errors", function() {
    it("should reject when there is an error opening the database", () => {
      var initPromise = gUserDatabase.init({"blockedLinks": []}, gMockObject);
      return initPromise.should.be.rejected;
    });

    it("should reject when there is an error saving to the database", async(function*() {
      yield gUserDatabase.init({"pinnedLinks": []});
      var savePromise = gUserDatabase.save("prefs", "blockedLinks", null, gMockObject);
      savePromise.should.eventually.be.rejected; // jshint ignore:line
    }));

    it("should reject when a simple request fails", () => {
      var faultyRequest = gMockObject.generateFaultyRequest("Simple Handler Error");
      var errMsg = "This is a request handler error";
      var simpleRequestHandlersPromise =
        gUserDatabase._setSimpleRequestHandlers(faultyRequest, errMsg);
      simpleRequestHandlersPromise.should.eventually.be.rejected; // jshint ignore:line
    });
  });
});
