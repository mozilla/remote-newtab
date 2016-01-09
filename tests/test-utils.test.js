const utils = require("tests/test-utils");
const {assert} = require("chai");

describe("test-utils", () => {
  describe("should...Log", () => {
    it("should not throw if something is logged", () => {
      assert.doesNotThrow(() => utils.shouldConsoleLog(() => console.log('foo')));
      assert.doesNotThrow(() => utils.shouldConsoleLog(() => console.log('foo'), 'foo'));
      assert.doesNotThrow(() => utils.shouldConsoleLog(() => console.log('foobar'), /foo/));

      assert.doesNotThrow(() => utils.shouldConsoleWarn(() => console.warn('foo')));
      assert.doesNotThrow(() => utils.shouldConsoleError(() => console.error('foo')));
    });
    it("should throw if something of that type is not logged", () => {
      assert.throws(() => utils.shouldConsoleLog(() => false),
        /Expected function to log but it did not/);
      assert.throws(() => utils.shouldConsoleLog(() => console.warn('foo')),
        /Expected function to log but it did not/);
    });
    it("should throw if log does not match the pattern", () => {
      assert.throws(() => utils.shouldConsoleLog(() => console.log('foo'), /bar/),
        /Expected function to log message with pattern \/bar\/, but message was foo/);
    });
  });
});
