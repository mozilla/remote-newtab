"use strict";
const path = require("path");
const child = require("child_process");
const assert = require("chai").assert;

const filepath = path.join(__dirname, "../bin/generate-locale-data.js");
const generateLocaleData = require("../bin/generate-locale-data.js");

function execute(args) {
  const command = `node ${filepath} ${args || ""}`;
  return child.execSync(command, {encoding: "utf8"});
}

describe("generateLocaleData", () => {
  describe("programmatic", () => {
    let result;
    let window;
    beforeEach(() => {
      window = {};
      result = generateLocaleData("en-US");
      eval(result.fileString);
    });

    it("should generate an object with messages and file string", () => {
      assert.ok(result);
      assert.property(result, "fileString");
      assert.property(result, "messages");
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
  describe("command line", () => {
    it("should generate some js", () => {
      const result = execute();
      assert.include(result, "window.newTabLocaleInfo");
      assert.include(result, "window.reactIntlLocaleData");
    });
    it("should take locale or l as an arg", () => {
      assert.include(execute("--locale es-ES"), `window.newTabLocaleInfo = {locale: "es-ES"`);
      assert.include(execute("--l es-ES"), `window.newTabLocaleInfo = {locale: "es-ES"`);
    });
  });


});
