/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* jshint node:true, esnext:true */

const blockedLinks = require("lib/blockedLinks");
const userDatabase = require("lib/userDatabase");
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
    return userDatabase.init({"blockedLinks": []})
      .then(blockedLinks.init)
      .then(blockedLinks.reset.bind(blockedLinks))
      .then(() => {
        userDatabase.close();
        done();
      });
  });

  it("should be empty initially", () => {
    var links = blockedLinks._links;
    assert.equal(links.size, 0);
  });

  it("should update the database and links", () => {
    return userDatabase.init({"blockedLinks": []}).then(() => {
      return blockedLinks.init().then(() => {
        assert.isTrue(blockedLinks.isEmpty());

        blockedLinks.block(firstLink);
        blockedLinks.block(secondLink);
        blockedLinks.block(thirdLink);
        blockedLinks.unblock(secondLink);

        return userDatabase.load("prefs", "blockedLinks").then(loadedBlockedLinks => {
          var storedBlockedLinks = JSON.stringify([firstLink, thirdLink]);
          assert.equal(loadedBlockedLinks, storedBlockedLinks);
          assert.equal(JSON.stringify([...blockedLinks._links]), storedBlockedLinks);
        });
      });
    });
  });

  it("should have no impact when attempting to unblock a link that isn't blocked", () => {
    return userDatabase.init({"blockedLinks": []}).then(() => {
      blockedLinks.init().then(() => {
        blockedLinks.unblock(secondLink);
        assert.isTrue(blockedLinks.isEmpty());
      });
    });
  });

  describe("userDatabase Errors", function() {
    it("should reject when there is an error opening the database", () => {
      var initPromise = userDatabase.init({"blockedLinks": []}, gMockObject);
      return initPromise.should.be.rejected;
    });

    it("should reject when there is an error saving to the database", async(function*() {
      yield userDatabase.init({"pinnedLinks": []});
      var savePromise = userDatabase.save("prefs", "blockedLinks", null, gMockObject);
      savePromise.should.eventually.be.rejected; // jshint ignore:line
    }));

    it("should reject when a simple request fails", () => {
      var faultyRequest = gMockObject.generateFaultyRequest("Simple Handler Error");
      var errMsg = "This is a request handler error";
      var simpleRequestHandlersPromise =
        userDatabase._setSimpleRequestHandlers(faultyRequest, errMsg);
      simpleRequestHandlersPromise.should.eventually.be.rejected; // jshint ignore:line
    });
  });
});
