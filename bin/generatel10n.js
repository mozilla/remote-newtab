#! /usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/**
 * Create the string bundles and then save them to disk.
 */
/*jshint node:true, esnext: true*/
"use strict";
const fs = require("fs");
const path = require("path");
const clc = require("cli-color");
const fetch = require("node-fetch"); // jshint ignore:line
const repo = "http://mxr.mozilla.org/l10n-central/source/";
const newTabPath = "/browser/chrome/browser/newTab";
const globalDirPath = "/dom/chrome/global.dtd";
const l10nPath = path.resolve(`${__dirname}/../l10n/`);
const defaultLocale = {};

// CLI-Colors
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;

/**
 * Helper object for representing string bundles.
 *
 * @constructor
 * @param {String} locale The locale for the string bundle.
 */
function StringBundle(locale) {
  this.locale = locale;
}

StringBundle.prototype = {
  get properties() {
    return `${repo}${this.locale}${newTabPath}.properties?raw=1`;
  },
  get dtd() {
    return `${repo}${this.locale}${newTabPath}.dtd?raw=1`;
  },
  get dir() {
    return `${repo}${this.locale}${globalDirPath}?raw=1`;
  },
  /**
   * Saves the bundle to disk.
   *
   * @return {Promise} Resolves once writing to disk is done is done.
   */
  save() {
    var globalDirPromise = fetch(this.dir)
      .then(assureResponse)
      .then(r => r.text())
      .then(processDTD);
    var dtdPromise = fetch(this.dtd)
      .then(assureResponse)
      .then(r => r.text())
      .then(processDTD);
    var propsPromise = fetch(this.properties)
      .then(assureResponse)
      .then(r => r.text())
      .then(processProps);

    return Promise.all([globalDirPromise, dtdPromise, propsPromise])
      .then((results) => validateResults(results, this.locale))
      // Reduce resulting objects into a single object, using the defaultLocale
      // as the base.
      .then(
        results => results.reduce(
          (prev, next) => Object.assign(prev, next), Object.assign({}, defaultLocale)
        )
      )
      .then(
        trimRedundantProps.bind(this)
      )
      .then(
        combinedObj => JSON.stringify(combinedObj, null, 2)
      )
      .then(
        (text) => writeToDisk(text, this.locale)
      )
      .catch(
        err => console.error(error(err))
      );
  }
};
/**
 * Attempts to recovers from HTTP errors (404 and 503).
 *
 * @param  {Response} response The response to check.
 * @return {Promise} Fulfills once an "ok" response is fetched.
 */
function assureResponse(response) {
  if (response.ok) {
    return Promise.resolve(response);
  }
  //otherwise, let's try to recover
  return new Promise(function(resolve, reject) {
    let msg = "";
    switch (response.status) {
    case 503:
      msg = `We got a 503 for: ${response.url} - trying again.`;
      console.warn(warn(msg));
      setTimeout(() => {
        fetch(response.url)
          .then(assureResponse)
          .then(resolve);
      }, 2000);
      break;
    case 404:
      msg = `l10n File is 404 : ${response.url}`;
      console.warn(warn(msg));
      // Node Response doesn't expose constructor, so fake it till you make it!
      const fakeResponse = {
        text() {
          return Promise.resolve("");
        }
      };
      resolve(fakeResponse);
      break;
    default:
      msg = `Could not handle ${response.status} for: ${response.url}`;
      console.error(error(msg));
      reject(new Error(error));
    }
  });
}
/**
 * Validate the data against the canonical default object.
 * Invalid properties are console.log()'ed.
 *
 * @param  {Objects[]} results results to be validated.
 * @param  {String} locale The corresponding locale.
 * @return {Object[]} the validated (unmodified) results.
 */
function validateResults(results, locale) {
  var tempObj = results.reduce(
    (prev, next) => Object.assign(prev, next), {}
  );
  var missingKeys = Object.keys(defaultLocale)
    .filter(key => !tempObj.hasOwnProperty(key));
  if (missingKeys.length) {
    console.warn(`
${warn("WARNING:")} Locale "${locale}" is missing keys. The en-US locale will fill the gaps:
 ${notice("* " + missingKeys.join("\n * "))}
    `);
  }
  return results;
}
/**
 * Writes the resulting JSON to the file system.
 *
 * @param  {String} data   The string to write to disk.
 * @param  {String} locale The locale that this data is for.
 * @return {Promise} Resolves when writing is done.
 */
function writeToDisk(data, locale) {
  return new Promise((resolve, reject) => {
    const dir = path.resolve(`${l10nPath}/${locale}/`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.writeFile(`${dir}/strings.json`, data, "utf8", (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
/**
 * Process DTD files by:
 *   - Split on each new line,
 *   - then filters out anything that doesn't start with "<!ENTITY"
 *   - then removes "<" and ">" and additional quotation marks.
 *   - then combines the remaining key/value pair into the result object.
 *
 * @param  {String} text Text to be processed.
 * @return {Object} The resulting object with the key value pairs.
 */
function processDTD(text) {
  const result = {};
  text.split("\n")
    .filter(
      line => line.trim().startsWith("<!ENTITY")
    )
    .map(
      line => line.replace("<!ENTITY ", "")
      .replace(">", "")
      .replace(/\"/g, "")
      .split(/\s(.+)?/)
      .filter(item => item)
    )
    .map(
      item => [item[0].trim(), item[1].trim()]
    )
    .sort(compareName)
    .forEach(
      nameValue => result[nameValue.shift()] = nameValue.shift()
    );
  return result;
}
/**
 * Process .properties files.
 *  - Split on new line
 *  - then remove comments
 *  - then map to key value pairs
 *  - then add key values pairs to resulting object.
 *
 * @param  {String} text The properties files to process.
 * @return {Object} The resulting object.
 */
function processProps(text) {
  const result = {};
  text.split("\n")
    .filter(line => !line.startsWith("#") && line.trim(line))
    .map(line => line.split(/=(.+)?/))
    .map(
      item => [item[0].trim(), item[1].trim()]
    )
    .sort(compareName)
    .forEach(
      nameValue => result[nameValue.shift().trim()] = nameValue.shift()
    );
  return result;
}

function compareName(a, b) {
  return a[0].localeCompare(b[0]);
}
/**
 * Reads file from path.
 *
 * @param  {String} file Path to file.
 * @return {Promise<String>} The data that was read from disk.
 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}
/**
 * Run only a few network requests at a time.
 *
 * @param {StringBundle[]} stringBundles the string bundles to save.
 * @param {Number} throughPut  How many network requests to perform simultaneously.
 */
function* fetchRunner(stringBundles, throughPut) { // jshint ignore:line
  // Gather N=throughPut requests, and wait until they are done before continuing.
  for (var i = 0; i < stringBundles.length;) {
    let bundles = [];
    for (var j = 0; j < throughPut; j++) {
      bundles.push(stringBundles[i++]);
      if (i >= stringBundles.length) {
        break;
      }
    }
    yield Promise.all(
      bundles.map(buldle => buldle.save())
    );
  }
}
/**
 * Runs through the locales, downloads the data, and saves it.
 *
 * @param {String[]} allLocales The list of locales to download.
 */
function generateL10NStrings(allLocales) {
  var stringBundles = allLocales
    .map(locale => new StringBundle(locale));
  var runner = fetchRunner(stringBundles, 3);
  var fetchSequentially = () => {
    var next = runner.next();
    if (!next.done) {
      return next.value.then(fetchSequentially);
    }
  };
  // Fetch a few at a time, otherwise mxr gets upset
  fetchSequentially();
}
/**
 * Trims properties that are not used in the about:newtab page.
 *
 * @param  {Object} obj the object from which props will be trimmed.
 * @return {Object} The object that got trimmed.
 */
function trimRedundantProps(obj) {
  var defaultProps = Object.getOwnPropertyNames(defaultLocale);
  var redudantProps = [];
  for (var name of Object.getOwnPropertyNames(obj)) {
    if (defaultProps.indexOf(name) === -1) {
      redudantProps.push(name);
      delete obj[name];
    }
  }
  if (redudantProps.length) {
    let msg = `${warn("WARNING:")} Redundant props in ${this.locale}:`; // jshint ignore:line
    msg += notice(`
 * ${redudantProps.join("\n * ")}`);
    console.warn(msg);
  }
  return obj;
}

//Read the default locale data (en-US)
Promise.all([
    readFile(l10nPath + "/global.dtd").then(processDTD),
    readFile(l10nPath + "/newTab.properties").then(processProps),
    readFile(l10nPath + "/newTab.dtd").then(processDTD),
  ])
  .then(
    defaultStrings => defaultStrings.reduce(
      (prev, next) => Object.assign(prev, next), defaultLocale
    )
  )
  .then(
    () => readFile(l10nPath + "/all-locales")
  )
  .then(
    locales => locales.split("\n").filter(locale => locale)
  )
  .then(
    allLocales => generateL10NStrings(allLocales)
  );
