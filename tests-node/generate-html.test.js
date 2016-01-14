"use strict";
const path = require("path");
const child = require("child_process");
const assert = require("chai").assert;

const filepath = path.join(__dirname, "../bin/generate-html.js");

describe("generateHTML", () => {
  let result;
  beforeEach(() => {
    result = child.execSync(`node ${filepath}`, {encoding: "utf8"});
  });

  it("should generate some html", () => {
    assert.ok(result);
  });
  it("should render locale", () => {
    assert.include(result, `<html lang="en-US">`);
  });
  it("should include file paths", () => {
    assert.include(result, './locale-data.js');
    assert.include(result, './main.js');
    assert.include(result, './main.css');
  });
});
