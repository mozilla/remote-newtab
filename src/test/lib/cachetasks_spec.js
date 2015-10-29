/* jshint esnext: true, expr: true */
/* globals expect, fetch, async, it, CacheTasks, caches, Request, Response*/
"use strict";
const CACHENAME = "test";
describe("CacheTasks", function() {
  // Helper functions

  describe("deleteAllCaches() method", () => {
    it("should delete all caches.", async(function*() {
      var cacheNames = [CACHENAME, "foo", "bar", "baz", "bing"];
      for (var name of cacheNames) {
        yield caches.open(name);
      }
      var result = yield CacheTasks.deleteAllCaches();
      var checkNameValue = function([name, value]) {
        return cacheNames.includes(name) && value === true;
      };
      expect(Array.from(result.entries()).every(checkNameValue)).to.be.true;
    }));
  });

  describe("populateCache() method", () => {
    it("should allow populating the cache", async(function*() {
      var result = yield CacheTasks.populateCache(["js/lib/async.js"], CACHENAME);
      expect(result).to.be.true;
    }));
  });

  describe("respondFromCache() method", () => {
    it("should respond when given a Request object.", async(function*() {
      var request = new Request("js/lib/async.js");
      var result = yield CacheTasks.respondFromCache(request, CACHENAME);
      expect(result.url === request.url).to.be.true;
    }));
    it("should respond when given a string.", async(function*() {
      var request = "js/lib/async.js";
      var result = yield CacheTasks.respondFromCache(request, CACHENAME);
      expect(result.url === new URL(request, window.location).href).to.be.true;
    }));
    it("should respond when given a URL.", async(function*() {
      var request = new URL("js/lib/async.js", window.location);
      var result = yield CacheTasks.respondFromCache(request, CACHENAME);
      expect(result.url === request.href).to.be.true;
    }));
    it("should reject when asked to respond with a missing entry.", () => {
      var promise = CacheTasks.respondFromCache("this/is/not/real", CACHENAME);
      promise.should.be.rejectedWith(Error);
    });
  });

  describe("hasCacheEntry() method", () => {
    it("should store entries in the cache.", async(function*() {
      var result = yield CacheTasks.hasCacheEntry("js/lib/async.js", CACHENAME);
      expect(result).to.be.true;
      result = yield CacheTasks.hasCacheEntry("/not/stored", CACHENAME);
      expect(result).to.be.false;
    }));
  });

  describe("refreshCacheEntry() method", () => {
    it("should reject if the entry is missing", () => {
      var promise = CacheTasks.refreshCacheEntry("this/is/not/real", CACHENAME);
      promise.should.be.rejectedWith(Error);
    });
    it("should return responses that are not stale without refreshing", async(function*() {
      var thePast = new Date(Date.now() - 100000).toGMTString();
      var request = new Request("fresh");
      var response = new Response("fresh", {
        headers: {
          "Date": thePast,
          "Test": "pass"
        }
      });
      yield CacheTasks.putCacheEntry(request, response, CACHENAME);
      var result = yield CacheTasks.refreshCacheEntry(request, CACHENAME);
      expect(result.headers.get("Date")).to.equal(thePast);
      expect(result.headers.get("Test")).to.equal("pass");
    }));
    it("should reject when refreshing an uncacheble response.", async(function*() {
      var request = "js/lib/async.js";
      var response = yield fetch(request);
      var thePast = new Date(Date.now() - 10000).toGMTString();
      response.headers.set("Expires", thePast);
      yield CacheTasks.putCacheEntry(request, response, CACHENAME);
      var promise = CacheTasks.refreshCacheEntry(request, CACHENAME);
      promise.should.eventually.be.rejectedWith(Error);
    }));
    it("should reject when refreshing an uncacheble response even with force.", async(function*() {
      var request = "js/lib/async.js";
      var response = yield fetch(request);
      var thePast = new Date(Date.now() - 10000).toGMTString();
      response.headers.set("Expires", thePast);
      yield CacheTasks.putCacheEntry(request, response, CACHENAME);
      var promise = CacheTasks.refreshCacheEntry(request, CACHENAME, "force");
      promise.should.eventually.be.rejectedWith(Error);
    }));
  });

  describe("putCacheEntry() method", () => {
    var request = new Request("test", {
      headers: {
        "test": "requestPass"
      }
    });
    var response = new Response("test", {
      headers: {
        "test": "responsePass"
      }
    });
    it("should put cachable entries in the cache.", async(function*() {
      var result = yield CacheTasks.putCacheEntry(request, response, CACHENAME);
      expect(result).to.be.true;
    }));
    it("should now have 'test' in the cache.", async(function*() {
      var result = yield CacheTasks.hasCacheEntry(request, CACHENAME);
      expect(result).to.be.true;
    }));
    it("should return false the request forbids caching", async(function*() {
      var uncachableRequest = new Request(".", {
        headers: {
          "Cache-Control": "no-store"
        }
      });
      var response = new Response("test", {
        headers: {
          "test": "responsePass"
        }
      });
      var result = yield CacheTasks.putCacheEntry(uncachableRequest, response, CACHENAME);
      expect(result).to.be.false;
    }));
    it("should return false the response forbids caching", async(function*() {
      var uncachableResponse = new Response(".", {
        headers: {
          "Cache-Control": "no-store"
        }
      });
      var request = new Request("test", {
        headers: {
          "test": "requestPass"
        }
      });
      var result = yield CacheTasks.putCacheEntry(request, uncachableResponse, CACHENAME);
      expect(result).to.be.false;
    }));
    it("should return false the response and response forbids caching", async(function*() {
      var uncachableRequest = new Request(".", {
        headers: {
          "Cache-Control": "no-store"
        }
      });
      var uncachableResponse = new Response(".", {
        headers: {
          "Cache-Control": "no-store"
        }
      });
      var result = yield CacheTasks.putCacheEntry(uncachableRequest, uncachableResponse, CACHENAME);
      expect(result).to.be.false;
    }));
  });

  describe("deleteCacheEntry() method", () => {
    it("should allow deleting cache entries", async(function*() {
      var request = new Request("deleteTest");
      var response = new Response("deleteTest");
      yield CacheTasks.putCacheEntry(request, response, CACHENAME);
      var hasEntry = yield CacheTasks.hasCacheEntry(request, CACHENAME);
      expect(hasEntry).to.be.true;
      var success = yield CacheTasks.deleteCacheEntry(request, CACHENAME);
      expect(success).to.be.true;
      hasEntry = yield CacheTasks.hasCacheEntry(request, CACHENAME);
      expect(hasEntry).to.be.false;
    }));
  });
});
