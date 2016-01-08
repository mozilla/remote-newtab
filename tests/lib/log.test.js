const {log, warn} = require("lib/log");
const {shouldConsoleLog, shouldConsoleWarn} = require("tests/test-utils");
const assert = require("chai").assert;

describe("log", () => {
  it("should log stuff", () => {
    shouldConsoleLog(() => log("foo"), "foo");
  });
  it("should warn", () => {
    shouldConsoleWarn(() => warn("foo"), "foo");
  });
});
