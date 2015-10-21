/*globals fetch, async */
"use strict";
describe("async API", () => {
  it("should reject when invoked with no arguments.", () => {
    var test = async();
    return test().should.be.rejected;
  });

  it("should reject when invoked with undefined.", () => {
    var test = async(undefined);
    return test().should.be.rejected;
  });

  it("should reject when invoked without a non-callable.", () => {
    var test = async("String can't be called!");
    return test().should.be.rejected;
  });

  it("should asynchronously resolve to the string pass.", () => {
    var test = async(function* () {
      var x = yield Promise.resolve("pass");
      return x;
    });
    return test().should.become("pass");
  });

  it("should reject when rejected.", () => {
    var error = new Error("testing111");
    var test = async(function* () {
      throw error;
    });
    return test().should.eventually.be.rejectedWith(error);
  });

  it("should recover and return in a catch.", () => {
    var error = new Error("");
    var test = async(function* () {
      try {
        yield Promise.reject(error);
      } catch (err) {
        return "pass";
      }
    });
    return test().should.become("pass");
  });

  it("Should reject after throwing.", () => {
    var error = new Error("Error");
    var test = async(function* () {
      try {
        yield Promise.reject(error);
      } catch (err) {
        throw err;
      }
    });
    return test().should.eventually.be.rejectedWith(error);
  });

  it("should recover from rejection.", () => {
    var test = async(function* () {
      var result = "";
      try {
        yield Promise.reject(new Error("pass"));
      } catch (error) {
        result = error.message;
      }
      return result;
    });
    return test().should.become("pass");
  });

  it("should recover from rejection and continue asynchronously.", () => {
    var test = async(function* () {
      var err = "";
      try {
        yield Promise.reject(new Error("exception_"));
      } catch (ex) {
        err = ex.message;
      }
      var w = yield (err + "recovered_");
      var z = yield (w + "123");
      return z; //exception_recovered_123
    });
    return test().should.become("exception_recovered_123");
  });

  it("should recover from rejection, then resolve with a string", () => {
    var test = async(function* () {
      try {
        yield Promise.reject(new Error());
      } catch (err) {
      }
      var w = yield "recovered";
      var y = yield w + `123`;
      var z = yield Promise.resolve(y);
      return z;
    });
    return test().should.become("recovered123");
  });

  it("should fetch 10 pages and resolve.", () => {
    var test = async(function* () {
      for (var i = 0; i < 10; i++) {
        var r = yield fetch("/?test=" + i);
        yield r.text();
      }
      return "pass";
    });
    test().should.become("pass");
  });

  it("should accept an argument being undefined.", () => {
    var test = async(function* (arg1) {
      return String(arg1);
    });
    return test().should.become("undefined");
  });

  it("should accept an argument.", () => {
    var test = async(function* (arg1) {
      return arg1;
    });
    return test("pass").should.become("pass");
  });

  it("should accept multiple arguments.", () => {
    var test = async(function* (arg1, arg2, arg3) {
      var result = {
        arg1: arg1 === 1,
        arg2: arg2 === 2,
        arg3: arg3 === 3,
        length: arguments.length === 3,
      };
      result = yield Promise.resolve(result);
      return result;
    });
    test(1, 2, 3).should.eventually.deep.equal(
      {arg1: true, arg2: true, arg3: true, length: 3}
    );
  });

  it("should work even when async is not actually async.", () => {
    var test = async(function() {
      return "pass";
    });
    return test().should.become("pass");
  });

  describe("binding tests", ()=> {
    var obj = {value: "123", value2: 321};

    it("should bind correctly when passed an object to bind to.", () => {
      var test = async(function* (arg1) {
        var result = {
          value: this.value === "123",
          value2: this.value2 === 321,
          arg1: arg1 === undefined
        };
        return result;
      }, obj);
      return test().should.eventually.deep.equal(
        {value: true, value2: true, arg1: true}
      );
    });

    it("should bind and accept arguments.", () => {
      var test = async(function* (arg1, arg2, arg3) {
        var t1 = yield (this.value === "123");
        var t2 = yield (this.value2 === 321);
        var t3 = yield (arg1 === 1);
        var t4 = yield (arg2 === 2);
        var t5 = yield (arg3 === 3);
        var t6 = yield (arguments.length === 3);
        var r = yield (t1 && t2 && t3 && t4 && t5 && t6); //All should be true
        return r;
      }, obj);
      return test(1, 2, 3).should.become(true);
    });
  });
});
