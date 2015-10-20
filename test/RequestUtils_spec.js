/* jshint esnext: true, expr: true, mocha: true */
/* globals expect, Request, Response, RequestUtils, it*/
"use strict";

function testType(type){
  return (method) => {
    return method(type);
  };
}
var tUndefined = testType(undefined);
var tString = testType("string");
var tNumber = testType(123);
var tArray = testType([]);
var tNull = testType(null);
var tFakeObj = testType({headers: new Map()});

describe("Request utils", function() {
  describe("isCacheable() method", ()=>{
    it("should throw given invalid input", ()=>{
      var f = RequestUtils.isCacheable;
      expect(() => tUndefined(f)).to.throw(TypeError);
      expect(() => tString(f)).to.throw(TypeError);
      expect(() => tNumber(f)).to.throw(TypeError);
      expect(() => tArray(f)).to.throw(TypeError);
      expect(() => tNull(f)).to.throw(TypeError);
      expect(() => tFakeObj(f)).to.throw(TypeError);
    });

    it("should return false when 'no-store' is present", ()=>{
      var request = new Request(".", {
        headers: {
          "Cache-Control": "no-store"
        }
      });
      expect(RequestUtils.isCacheable(request)).to.be.false;
    });

    it("should return true when 'no-store' is not present", ()=>{
      var request = new Request(".");
      expect(RequestUtils.isCacheable(request)).to.be.true;
    });

    it("should return true when 'no-store' is not present", ()=>{
      var request = new Request(".");
      expect(RequestUtils.isCacheable(request)).to.be.true;
    });
  });
});
