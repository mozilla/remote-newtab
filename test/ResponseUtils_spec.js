/* jshint esnext: true, expr: true, mocha: true */
/* globals expect, Response, ResponseUtils, it*/
"use strict";
describe("Response utils", function() {
  describe("isCacheable() method", ()=> {
    it("should return true with no Cache-Control header is present.", ()=> {
      var response = new Response("");
      expect(ResponseUtils.isCacheable(response)).to.be.true;
    });
    it("should return false when Cache-Control forbids caching", ()=> {
      var response = new Response(".", {
        headers: {
          "Cache-Control": "no-store"
        }
      });
      expect(ResponseUtils.isCacheable(response)).to.be.false;
    });
    it("should return false when max-age or Expires is missing", ()=> {
      var response = new Response(".", {
        headers: {
          "Cache-Control": "test"
        }
      });
      expect(ResponseUtils.isCacheable(response)).to.be.false;
    });
    it("should return true when max-age is present", ()=> {
      var response = new Response(".", {
        headers: {
          "Cache-Control": "max-age=123"
        }
      });
      expect(ResponseUtils.isCacheable(response)).to.be.true;
    });
    it("should return true when Expires header is present", ()=> {
      var response = new Response(".", {
        headers: {
          "Expires": "Mon, 19 Oct 2015 00:02:04 GMT",
        }
      });
      expect(ResponseUtils.isCacheable(response)).to.be.true;
    });
  });
  describe("isExpired() method", ()=> {
    it("Should throw when the Expires header is missing.", ()=> {
      var response = new Response(".");
      expect(
        () => ResponseUtils.isExpired(response)
      ).to.throw(Error);
    });
    it("Should return true when the Expires date is in the past.", ()=> {
      var response = new Response(".");
      var thePast = new Date(Date.now() - 10000).toGMTString();
      response.headers.set("Expires", thePast);
      expect(ResponseUtils.isExpired(response)).to.be.true;
    });
    it("Should return false when the Expires date is in the future.", ()=> {
      var response = new Response(".");
      var theFuture = new Date(Date.now() + 100000).toGMTString();
      response.headers.set("Expires", theFuture);
      expect(ResponseUtils.isExpired(response)).to.be.false;
    });
    it("Should return false when the Expires date is now.", ()=> {
      var response = new Response(".");
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Expires", now);
      expect(ResponseUtils.isExpired(response)).to.be.false;
    });
    it("Should throw when the Expires date not a number.", ()=> {
      var response = new Response(".");
      var date = "invalid date!";
      response.headers.set("Expires", date);
      expect(
        () => ResponseUtils.isExpired(response)
      ).to.throw(TypeError);
    });
  });

  describe("hasMaxAgeLapsed() method", ()=> {
    it("should throw if there is no Cache-Control header.", ()=> {
      var response = new Response(".");
      expect(
        () => ResponseUtils.hasMaxAgeLapsed(response)
      ).to.throw(Error);
    });
    it("should throw if there is no max-age header.", ()=> {
      var response = new Response(".");
      response.headers.set("Cache-Control", "no-age=0");
      expect(
        () => ResponseUtils.hasMaxAgeLapsed(response)
      ).to.throw(Error);
    });
    it("should throw if there is no Date header.", ()=> {
      var response = new Response(".");
      response.headers.set("Cache-Control", "max-age=123");
      expect(
        () => ResponseUtils.hasMaxAgeLapsed(response)
      ).to.throw(Error);
    });
    it("should throw if Date header can't be parsed.", ()=> {
      var response = new Response(".");
      response.headers.set("Cache-Control", "max-age=123");
      response.headers.set("Date", "invalid");
      expect(
        () => ResponseUtils.hasMaxAgeLapsed(response)
      ).to.throw(Error);
    });
    it("should throw if max-age directive can't be parsed.", ()=> {
      var response = new Response(".");
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", now);
      response.headers.set("Cache-Control", "max-age=invalid");
      expect(
        () => ResponseUtils.hasMaxAgeLapsed(response)
      ).to.throw(Error);
    });
    it("should return true if the max-age has passed.", ()=> {
      var response = new Response(".");
      var longBeforeNow = new Date(Date.now() - 100000);
      var aBitBeforeNow = new Date(Date.now() - 10000);
      var maxAge = (aBitBeforeNow - longBeforeNow) / 1000; //to seconds
      response.headers.set("Date", longBeforeNow.toGMTString());
      response.headers.set("Cache-Control", `max-age=${maxAge}`);
      expect(ResponseUtils.hasMaxAgeLapsed(response)).to.be.true;
    });
    it("should return false if the max-age hasn't passed.", ()=> {
      var response = new Response(".");
      var beforeNow = new Date(Date.now() - 100000);
      var afterNow = new Date(Date.now() + 100000);
      var maxAge = (afterNow - beforeNow) / 1000; //to seconds
      response.headers.set("Date", beforeNow.toGMTString());
      response.headers.set("Cache-Control", `max-age=${maxAge}`);
      expect(ResponseUtils.hasMaxAgeLapsed(response)).to.be.false;
    });
    it("should return false if the max-age is 'now'.", ()=> {
      var response = new Response(".");
      var now = new Date(Date.now());
      response.headers.set("Date", now.toGMTString());
      response.headers.set("Cache-Control", "max-age=0");
      expect(ResponseUtils.hasMaxAgeLapsed(response)).to.be.false;
    });
  });
  describe("isStale() method", ()=> {
    it("Should return true when the Expires date is in the past.", ()=> {
      var response = new Response(".");
      var thePast = new Date(Date.now() - 10000).toGMTString();
      response.headers.set("Expires", thePast);
      expect(ResponseUtils.isStale(response)).to.be.true;
    });
    it("Should return false when the Expires date is in the future.", ()=> {
      var response = new Response(".");
      var theFuture = new Date(Date.now() + 100000).toGMTString();
      response.headers.set("Expires", theFuture);
      expect(ResponseUtils.isStale(response)).to.be.false;
    });
    it("Should return false when the Expires date is now.", ()=> {
      var response = new Response(".");
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Expires", now);
      expect(ResponseUtils.isStale(response)).to.be.false;
    });
    it("Should throw when the Expires date not a number.", ()=> {
      var response = new Response(".");
      var date = "invalid date!";
      response.headers.set("Expires", date);
      expect(
        () => ResponseUtils.isStale(response)
      ).to.throw(TypeError);
    });
    it("should throw if there is no max-age header.", ()=> {
      var response = new Response(".");
      response.headers.set("Cache-Control", "not-max-age=0");
      expect(
        () => ResponseUtils.isStale(response)
      ).to.throw(Error);
    });
    it("should throw if there is no Date header.", ()=> {
      var response = new Response(".");
      response.headers.set("Cache-Control", "max-age=123");
      expect(
        () => ResponseUtils.isStale(response)
      ).to.throw(Error);
    });
    it("should throw if Date header can't be parsed.", ()=> {
      var response = new Response(".");
      response.headers.set("Cache-Control", "max-age=123");
      response.headers.set("Date", "invalid");
      expect(
        () => ResponseUtils.isStale(response)
      ).to.throw(Error);
    });
    it("should throw if max-age directive can't be parsed.", ()=> {
      var response = new Response(".");
      var now = new Date(Date.now()).toGMTString();
      response.headers.set("Date", now);
      response.headers.set("Cache-Control", "max-age=invalid");
      expect(
        () => ResponseUtils.isStale(response)
      ).to.throw(Error);
    });
    it("should return true if the max-age has passed.", ()=> {
      var response = new Response(".");
      var longBeforeNow = new Date(Date.now() - 1000000);
      var aBitBeforeNow = new Date(Date.now() - 10000);
      var maxAge = (aBitBeforeNow - longBeforeNow) / 1000; //to seconds
      response.headers.set("Date", longBeforeNow.toGMTString());
      response.headers.set("Cache-Control", `max-age=${maxAge}`);
      expect(ResponseUtils.isStale(response)).to.be.true;
    });
    it("should return false if the max-age hasn't passed.", ()=> {
      var response = new Response(".");
      var beforeNow = new Date(Date.now() - 100000);
      var afterNow = new Date(Date.now() + 100000);
      var maxAge = (afterNow - beforeNow) / 1000; //to seconds
      response.headers.set("Date", beforeNow.toGMTString());
      response.headers.set("Cache-Control", `max-age=${maxAge}`);
      expect(ResponseUtils.isStale(response)).to.be.false;
    });
    it("should return false if the max-age is 'now'.", ()=> {
      var response = new Response(".");
      var now = new Date(Date.now());
      response.headers.set("Date", now.toGMTString());
      response.headers.set("Cache-Control", "max-age=0");
      expect(ResponseUtils.isStale(response)).to.be.false;
    });
  });
});
