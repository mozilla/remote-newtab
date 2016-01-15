#! /usr/bin/env node
"use strict";
const glob = require("glob");
const path = require("path");
const fs = require("fs-extra")

const generateHtml = require("./generate-html");
const generateLocaleData = require("./generate-locale-data");

const PAGE_TITLE_KEY = "newtab-pageTitle";
const JS_FILENAME = "locale-data.js";

const defaults = {
  outputPath: path.join(__dirname, "../build"),
  i10nPath: path.join(__dirname, "../l10n"),
  staticPath: path.join(__dirname, "../www"),
  channels: ["nightly", "aurora", "beta", "release", "esr"]
}

class DirectoryGenerator {
  constructor(rawOptions) {
    const options = Object.assign({}, defaults, rawOptions);
    Object.keys(options).forEach(key => this[key] = options[key]);

    this.locales = glob.sync(`${this.i10nPath}/*/`).map(file => path.relative(this.i10nPath, file));
    this.staticFiles = glob.sync(`${this.staticPath}/**/*`).map(file => path.relative(this.staticPath, file));
  }

  outputFiles(options) {
    const js = options.js;
    const html = options.html;
    const dirPath = options.dirPath;

    const jsPath = path.join(dirPath, JS_FILENAME);
    const htmlPath = path.join(dirPath, "index.html");

    this.staticFiles.forEach(file => {
      fs.copySync(path.join(this.staticPath, file), path.join(dirPath, file));
    });

    fs.outputFileSync(jsPath, js, "utf8");
    fs.outputFileSync(htmlPath, html, "utf8");
  }

  generateForLocale(locale) {
    const localeData = generateLocaleData(locale);
    const messages = localeData.messages;
    const js = localeData.fileString;
    const html = generateHtml({
      title: messages[PAGE_TITLE_KEY] || "New Tab",
      locale,
      paths: {
        localeData: JS_FILENAME,
        js: "main.js",
        css: "main.css"
        // TODO prerender
      }
    });

    this.channels.forEach(channel => {
      this.outputFiles({html, js, dirPath: path.join(this.outputPath, channel, locale)});
    });
  }

  run() {
    this.locales.forEach(this.generateForLocale.bind(this));
  }

}

module.exports = DirectoryGenerator;

if (require.main === module)  {
  // called from command line
  const args = require("minimist")(process.argv.slice(2), {alias: {
    outputPath: ['o', 'output'],
    i10nPath: ['i', 'input'],
    staticPath: ['s', 'static'],
    channels: ['c']
  }});
  const generator = new DirectoryGenerator(args);
  console.log('Generating directories...');
  generator.run();
  console.log(`Finished generating directories for:
  ${generator.channels.length} channels
  ${generator.locales.length} locales`);
}
