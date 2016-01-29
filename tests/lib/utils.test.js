const assert = require("chai").assert;
const utils = require("lib/utils");

describe("utils", () => {
  describe("updateState", () => {
    it("should merge two objects", () => {
      const result = utils.updateState({foo: "foo", bar: 0}, {bar: "bar", baz: "baz"});
      assert.deepEqual(result, {foo: "foo", bar: "bar", baz: "baz"});
    });
    it("should create a new object", () => {
      const state = {foo: "foo"};
      const newState = {foo: "foo"};
      const result = utils.updateState(state, newState);
      assert.notEqual(result, state);
      assert.notEqual(result, newState);
    });
  });

  describe("parseBoolean", () => {
    it("should leave booleans unchanged", () => {
      assert.equal(utils.parseBoolean(true), true);
      assert.equal(utils.parseBoolean(false), false);
    });
    it("should parse strings", () => {
      assert.equal(utils.parseBoolean('true'), true);
      assert.equal(utils.parseBoolean('false'), false);
    });
    it("should coerce other types", () => {
      assert.equal(utils.parseBoolean(1), true);
      assert.equal(utils.parseBoolean(null), false);
    });
  });

  describe("request", () => {
    it("should return a request shape action", () => {
      assert.deepEqual(utils.request('foo'), {type: 'foo'});
    });
  });

  describe("receive", () => {
    it("should return a receive shape action", () => {
      assert.deepEqual(utils.receive('foo', {stuff: 'blah'}), {type: 'foo', data: {stuff: 'blah'}});
    });
  });
});
