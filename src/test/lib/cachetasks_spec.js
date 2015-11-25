/* jshint esnext: true, expr: true */
/* globals expect, async, it, CacheTasks, caches, Request, Response, Headers*/
"use strict";
const CACHENAME = "test";

function testType(type) {
  return (method) => {
    return method(type);
  };
}
var tUndefined = testType(undefined);
var tString = testType("string");
var tNumber = testType(123);
var tArray = testType([]);
var tNull = testType(null);
var tFakeObj = testType({
  headers: new Map()
});
var tRequest = testType(new Request(""));

describe("CacheTasks", function() {
  describe("deleteCaches() method", () => {
    it("should delete all caches when no argument is given.", async(function*() {
      var cacheNames = [CACHENAME, "foo", "bar", "baz", "bing"].concat(yield caches.keys());
      for (var name of cacheNames) {
        yield caches.open(name);
      }
      var result = yield CacheTasks.deleteCaches();
      var checkNameValue = async(function*([name, value]) {
        var hasCache = yield caches.has(name);
        return cacheNames.includes(name) && value === true && hasCache === false;
      });
      for (var entry of result.entries()) {
        let test = yield checkNameValue(entry);
        expect(test).to.be.true;
      }
      var keys = yield caches.keys();
      expect(keys.length).to.equal(0);
    }));
    it("should delete the given caches.", async(function*() {
      var cachesToKeep = ["keep1", "keep2"];
      var cachesToDelete = ["delete1", "delete2"];
      for (var name of cachesToKeep.concat(cachesToDelete)) {
        yield caches.open(name);
      }
      var result = yield CacheTasks.deleteCaches(cachesToDelete);
      var keys = yield caches.keys();
      expect(keys).to.eql(cachesToKeep);
      result = yield CacheTasks.deleteCaches(cachesToKeep);
      keys = yield caches.keys();
      expect(keys.length).to.equal(0);
    }));
  });

  describe("addAll() method", () => {
    it("should allow populating the cache.", async(function*() {
      var result = yield CacheTasks.addAll(["js/lib/async.js"], CACHENAME);
      expect(result).to.be.true;
    }));
    it("should result in false when trying to add garbage to the cache.", async(function*() {
      var result = yield CacheTasks.addAll(["file:///foo", "about:config"], CACHENAME);
      expect(result).to.be.false;
    }));
  });

  describe("match() method", () => {
    it("should respond when given a Request object.", async(function*() {
      var request = new Request("js/lib/async.js");
      var result = yield CacheTasks.match(request, CACHENAME);
      expect(result.url).to.equal(request.url);
    }));
    it("should respond when given a string.", async(function*() {
      var request = "js/lib/async.js";
      var result = yield CacheTasks.match(request, CACHENAME);
      var expectedURL = new URL(request, window.location).href;
      expect(result.url).to.equal(expectedURL);
    }));
    it("should respond when given a URL.", async(function*() {
      var request = new URL("js/lib/async.js", window.location);
      var result = yield CacheTasks.match(request, CACHENAME);
      expect(result.url).to.equal(request.href);
    }));
    it("should return undefined with missing entry.", async(function*() {
      var result = yield CacheTasks.match("no-such-entry", CACHENAME);
      expect(result).to.equal(undefined);
    }));
  });

  describe("has() method", () => {
    it("should store entries in the cache.", async(function*() {
      var result = yield CacheTasks.has("js/lib/async.js", CACHENAME);
      expect(result).to.be.true;
      result = yield CacheTasks.has("/not/stored", CACHENAME);
      expect(result).to.be.false;
    }));
  });

  describe("put() method", () => {
    var request = new Request("test");
    it("should put cachable entries in the cache.", async(function*() {
      var response = new Response("test");
      var result = yield CacheTasks.put(request, response, CACHENAME);
      expect(result).to.be.true;
    }));
    it("should now have 'test' in the cache.", async(function*() {
      var result = yield CacheTasks.has(request, CACHENAME);
      expect(result).to.be.true;
    }));
    it("should return false the request forbids caching", async(function*() {
      var uncachableRequest = new Request(".", {
        headers: {
          "Cache-Control": "no-store"
        }
      });
      var response = new Response("test");
      var result = yield CacheTasks.put(uncachableRequest, response, CACHENAME);
      expect(result).to.be.false;
    }));
    it("should return false the response forbids caching", async(function*() {
      var uncachableResponse = new Response(".", {
        headers: {
          "Cache-Control": "no-store"
        }
      });
      var result = yield CacheTasks.put("test", uncachableResponse, CACHENAME);
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
      var result = yield CacheTasks.put(uncachableRequest, uncachableResponse, CACHENAME);
      expect(result).to.be.false;
    }));
    it("should return true if the max-age is still valid.", async(function*() {
      var request = new Request("test");
      var response = new Response(".");
      var beforeNow = new Date(Date.now() - 100000);
      var afterNow = new Date(Date.now() + 100000);
      var maxAge = (afterNow - beforeNow) / 1000; //to seconds
      response.headers.set("Date", beforeNow.toGMTString());
      response.headers.set("Cache-Control", `max-age=${maxAge}`);
      var result = yield CacheTasks.put(request, response, CACHENAME);
      expect(result).to.be.true;
    }));
    it("should put a response that has not expired.", async(function*() {
      var response = new Response(".");
      var theFuture = new Date(Date.now() + 100000).toGMTString();
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", now);
      response.headers.set("Expires", theFuture);
      var result = yield CacheTasks.put(request, response, CACHENAME);
      expect(result).to.be.true;
    }));
    it("should put a response that has expired.", async(function*() {
      var response = new Response(".");
      var thePast = new Date(Date.now() - 100000).toGMTString();
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", now);
      response.headers.set("Expires", thePast);
      var result = yield CacheTasks.put(request, response, CACHENAME);
      expect(result).to.be.true;
    }));
  });
  describe("isStale() method", () => {
    it("should throw given invalid input", () => {
      var f = CacheTasks.isStale;
      expect(() => tUndefined(f)).to.throw(TypeError);
      expect(() => tString(f)).to.throw(TypeError);
      expect(() => tNumber(f)).to.throw(TypeError);
      expect(() => tArray(f)).to.throw(TypeError);
      expect(() => tNull(f)).to.throw(TypeError);
      expect(() => tFakeObj(f)).to.throw(TypeError);
      expect(() => tRequest(f)).to.throw(TypeError);
    });
    it("should return true when the Expires date is in the past.", () => {
      var response = new Response(".");
      var thePast = new Date(Date.now() - 10000).toGMTString();
      response.headers.set("Expires", thePast);
      expect(CacheTasks.isStale(response)).to.be.true;
    });
    it("should return false when the Expires date is in the future.", () => {
      var response = new Response(".");
      var theFuture = new Date(Date.now() + 100000).toGMTString();
      response.headers.set("Expires", theFuture);
      expect(CacheTasks.isStale(response)).to.be.false;
    });
    it("should return false when the Expires date is now.", () => {
      var response = new Response(".");
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Expires", now);
      expect(CacheTasks.isStale(response)).to.be.false;
    });
    it("should throw when the Expires date not a number.", () => {
      var response = new Response(".");
      var date = "invalid date!";
      response.headers.set("Expires", date);
      expect(
        () => CacheTasks.isStale(response)
      ).to.throw(TypeError);
    });
    it("should throw if there is no max-age header.", () => {
      var response = new Response(".");
      response.headers.set("Cache-Control", "not-max-age=0");
      expect(
        () => CacheTasks.isStale(response)
      ).to.throw(Error);
    });
    it("should throw if there is no Date header.", () => {
      var response = new Response(".");
      response.headers.set("Cache-Control", "max-age=123");
      expect(
        () => CacheTasks.isStale(response)
      ).to.throw(Error);
    });
    it("should throw if Date header can't be parsed.", () => {
      var response = new Response(".");
      response.headers.set("Cache-Control", "max-age=123");
      response.headers.set("Date", "invalid");
      expect(
        () => CacheTasks.isStale(response)
      ).to.throw(Error);
    });
    it("should throw if max-age directive can't be parsed.", () => {
      var response = new Response(".");
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", now);
      response.headers.set("Cache-Control", "max-age=invalid");
      expect(
        () => CacheTasks.isStale(response)
      ).to.throw(Error);
    });
    it("should return true if the max-age has passed.", () => {
      var response = new Response(".");
      var longBeforeNow = new Date(Date.now() - 1000000);
      var aBitBeforeNow = new Date(Date.now() - 10000);
      var maxAge = (aBitBeforeNow - longBeforeNow) / 1000; //to seconds
      response.headers.set("Date", longBeforeNow.toGMTString());
      response.headers.set("Cache-Control", `max-age=${maxAge}`);
      expect(CacheTasks.isStale(response)).to.be.true;
    });
    it("should return false if the max-age hasn't passed.", () => {
      var response = new Response(".");
      var beforeNow = new Date(Date.now() - 100000);
      var afterNow = new Date(Date.now() + 100000);
      var maxAge = (afterNow - beforeNow) / 1000; //to seconds
      response.headers.set("Date", beforeNow.toGMTString());
      response.headers.set("Cache-Control", `max-age=${maxAge}`);
      expect(CacheTasks.isStale(response)).to.be.false;
    });
    it("should return false if the max-age is 'now'.", () => {
      var response = new Response(".");
      var now = new Date(Date.now());
      response.headers.set("Date", now.toGMTString());
      response.headers.set("Cache-Control", "max-age=0");
      expect(CacheTasks.isStale(response)).to.be.false;
    });
    it("should return false if there is no cache information.", () => {
      var response = new Response(".");
      expect(CacheTasks.isStale(response)).to.be.false;
    });
  });
  describe("delete() method", () => {
    it("should allow deleting cache entries", async(function*() {
      var request = new Request("deleteTest");
      var response = new Response("deleteTest");
      yield CacheTasks.put(request, response, CACHENAME);
      var hasEntry = yield CacheTasks.has(request, CACHENAME);
      expect(hasEntry).to.be.true;
      var success = yield CacheTasks.delete(request, CACHENAME);
      expect(success).to.be.true;
      hasEntry = yield CacheTasks.has(request, CACHENAME);
      expect(hasEntry).to.be.false;
    }));
  });
  describe("update() method", () => {
    it("should not update a response that is not stale.", async(function*() {
      var request = new Request("not-stale");
      var response = new Response(".");
      var theFuture = new Date(Date.now() + 100000).toGMTString();
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", now);
      response.headers.set("Expires", theFuture);
      response.headers.set("X-Test", "pass");
      yield CacheTasks.put(request, response, CACHENAME);
      var updatedResponse = yield CacheTasks.update(request, CACHENAME);
      expect(updatedResponse.headers.get("X-Test")).to.equal("pass");
      expect(updatedResponse.headers.get("Date")).to.equal(now);
      expect(updatedResponse.headers.get("Expires")).to.equal(theFuture);
    }));
    it("should update a response that has expired.", async(function*() {
      var request = new Request("./");
      var response = new Response(".");
      var thePast = new Date(Date.now() - 100000).toGMTString();
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", thePast);
      response.headers.set("Expires", thePast);
      response.headers.set("X-Test", "fail");
      yield CacheTasks.put(request, response, CACHENAME);
      var updatedResponse = yield CacheTasks.update(request, CACHENAME);
      expect(updatedResponse.headers.get("Expires")).to.not.equal(thePast);
      expect(updatedResponse.headers.get("Date")).to.equal(now);
      expect(updatedResponse.headers.get("X-Test")).to.equal(null);
    }));
    it("should put a request that doesn't exist.", async(function*() {
      var request = new Request("./");
      yield CacheTasks.delete(request, CACHENAME);
      var response = yield CacheTasks.update("./", CACHENAME);
      expect(response).to.be.ok;
    }));
    it("should forcibly update a request.", async(function*() {
      var request = new Request("http://localhost:9999/update-tests");
      var response = new Response("");
      var thePast = new Date(Date.now() - 100000).toGMTString();
      var theFuture = new Date(Date.now() + 100000).toGMTString();
      response.headers.set("Date", thePast);
      response.headers.set("Expires", theFuture);
      response.headers.set("X-Test", "client");
      yield CacheTasks.put(request, response, CACHENAME);
      var ops = {force: true};
      request = new Request("http://localhost:9999/update-tests");
      var updatedResponse = yield CacheTasks.update(request, CACHENAME, ops);
      expect(updatedResponse.headers.get("X-Test")).to.equal(null);
    }));
    it("should not update a response when not forced.", async(function*() {
      var request = new Request("update-test");
      var response = new Response(".");
      var theFuture = new Date(Date.now() + 100000).toGMTString();
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", now);
      response.headers.set("Expires", theFuture);
      response.headers.set("X-Test", "pass");
      yield CacheTasks.put(request, response, CACHENAME);
      var ops = {force: false};
      var updatedResponse = yield CacheTasks.update(request, CACHENAME, ops);
      expect(updatedResponse.headers.get("X-Test")).to.equal("pass");
      expect(updatedResponse.headers.get("Date")).to.equal(now);
      expect(updatedResponse.headers.get("Expires")).to.equal(theFuture);
    }));
    it("should return an existing/expired response when fetch fails.", async(function*() {
      // The port should cause a network error
      var request = new Request("http://localhost:12345/");
      var response = new Response(".");
      var thePast = new Date(Date.now() - 100000).toGMTString();
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", now);
      response.headers.set("Expires", thePast);
      response.headers.set("X-Test", "pass");
      // store the bad req/resp pair, as it it was good.
      yield CacheTasks.put(request, response, CACHENAME);
      var updatedResponse = yield CacheTasks.update(request, CACHENAME);
      expect(updatedResponse.headers.get("X-Test")).to.equal("pass");
      expect(updatedResponse.headers.get("Date")).to.equal(now);
      expect(updatedResponse.headers.get("Expires")).to.equal(thePast);
      yield CacheTasks.delete(request, CACHENAME);
    }));
    it("should return the cached response for errors in the 400 and 500 range.", async(function*() {
      var cachedRequest = new Request("http://localhost:9999/update-tests/");
      var response = new Response(".");
      var thePast = new Date(Date.now() - 1000000).toGMTString();
      var uniqueValue = "pass" + Math.random();
      response.headers.set("Date", thePast);
      response.headers.set("Expires", thePast);
      response.headers.set("X-Test", uniqueValue);
      // store the bad req/resp pair, as it it was good.
      yield CacheTasks.put(cachedRequest, response, CACHENAME);
      var errorCodes = [400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410,
        411, 412, 413, 414, 415, 416, 417, 418, 421, 426, 428, 429, 431, 500,
        501, 502, 503, 504, 505, 506, 507, 511];
      for (var errorCode of errorCodes) {
        let headers = new Headers();
        headers.set("statusoverride", String(errorCode));
        let request = new Request("http://localhost:9999/update-tests/", {
          headers
        });
        var updatedResponse = yield CacheTasks.update(request, CACHENAME);
        expect(updatedResponse.headers.get("X-Test")).to.equal(uniqueValue);
        expect(updatedResponse.headers.get("Date")).to.equal(thePast);
        expect(updatedResponse.headers.get("Expires")).to.equal(thePast);
      }
      yield CacheTasks.delete(cachedRequest, CACHENAME);
    }));
    it("should throw when forced, but fetch fails.", async(function*() {
      // The port should cause a network error
      var request = new Request("http://localhost:12345/");
      var response = new Response(".");
      var thePast = new Date(Date.now() - 100000).toGMTString();
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", now);
      response.headers.set("Expires", thePast);
      response.headers.set("X-Test", "pass");
      // store the bad req/resp pair, as it was good.
      yield CacheTasks.put(request, response, CACHENAME);
      var promise = CacheTasks.update(request, CACHENAME, {force: true});
      promise.should.eventually.be.rejected;
      try {
        yield promise;
      } catch (err) {}
      yield CacheTasks.delete(request, CACHENAME);
    }));
    it("should throw when fetch fails, and there is no fallback response.", ()=> {
      var request = new Request("http://localhost:12345/");
      CacheTasks.update(request, CACHENAME).should.be.rejected;
      CacheTasks.update(request, CACHENAME, {force: true}).should.be.rejected;
      CacheTasks.update(request, CACHENAME, {force: false}).should.be.rejected;
    });
  });
});
