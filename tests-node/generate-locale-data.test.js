"use strict";
const path = require("path");
const child = require("child_process");
const assert = require("chai").assert;

const filepath = path.join(__dirname, "../bin/generate-locale-data.js");

function execute(args) {
  return child.execSync(`node ${filepath}`, {input: args, encoding: "utf8"});
}

describe("generateLocaleData", () => {
  let result;
  let window;
  beforeEach(() => {
    window = {};
    result = execute();
    eval(result);
  });

  it("should generate some js", () => {
    assert.ok(result);
  });

  it("should add newTabLocaleInfo to window", () => {
    assert.property(window, 'newTabLocaleInfo');
    assert.property(window.newTabLocaleInfo, 'locale');
    assert.property(window.newTabLocaleInfo, 'messages');
    assert.isObject(window.newTabLocaleInfo.messages);
  });

  it("should add reactIntlData to window", () => {
    assert.property(window, 'reactIntlLocaleData');
    assert.isArray(window.reactIntlLocaleData);
  });
});
