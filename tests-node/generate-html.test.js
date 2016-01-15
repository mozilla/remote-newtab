"use strict";
const path = require("path");
const child = require("child_process");
const assert = require("chai").assert;

const filepath = path.join(__dirname, "../bin/generate-html.js");
const generateHTML = require("../bin/generate-html");

function execute(args) {
  const command = `node ${filepath} ${args || ""}`;
  return child.execSync(command, {encoding: "utf8"});
}

describe("generateHTML", () => {
  it("should generate some html", () => {
    assert.ok(generateHTML());
    assert.include(generateHTML(), `<html lang="en-US">`);
    assert.include(generateHTML(), `<title>New Tab</title>`);
  });
  it("should render locale", () => {
    assert.include(generateHTML({locale: "es-ES"}), `<html lang="es-ES">`);
  });
  it("should include file paths", () => {
    const result = execute();
    assert.include(result, './locale-data.js');
    assert.include(result, './main.js');
    assert.include(result, './main.css');
  });
  describe("command line", () => {
    it("should generate some html", () => {
      assert.ok(execute());
    });
    it("should take locale as an arg", () => {
      assert.include(execute("-l es-ES"), `<html lang="es-ES">`);
      assert.include(execute("--locale es-ES"), `<html lang="es-ES">`);
    });
    it("should take title as an arg", () => {
      assert.include(execute("-t foo"), `<title>foo</title>`);
      assert.include(execute("--title foo"), `<title>foo</title>`);
    });
  });
});
