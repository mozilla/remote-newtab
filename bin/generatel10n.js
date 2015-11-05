#! /usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/**
 * Create the string bundles and then save them to disk.
 */
/*jshint node:true, browser:false*/
"use strict";
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch"); // jshint ignore:line
const repo = "http://mxr.mozilla.org/l10n-central/source/";
const newTabPath = "/browser/chrome/browser/newTab";
const globalDirPath = "/dom/chrome/global.dtd";
const l10nPath = path.resolve(`${__dirname}/../l10n/`);
const defaultLocale = {};
/**
 * Helper object for managing state
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
   * @return {Promise} Resolves once writing to disk is done is done.
   */
  save() {
    var globalDirPromise = fetch(this.dir)
      .then(r => r.text())
      .then(processDTD);
    var dtdPromise = fetch(this.dtd)
      .then(r => r.text())
      .then(processDTD);
    var propsPromise = fetch(this.properties)
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
        combinedObj => JSON.stringify(combinedObj, null, 2)
      )
      .then(
        (text) => writeToDisk(text, this.locale)
      )
      .catch(
        err => console.error(err)
      );
  }
};

function validateResults(results, locale) {
  var tempObj = results.reduce(
      (prev, next) => Object.assign(prev, next), {}
  );
  var missingKeys = Object.keys(defaultLocale)
    .filter(key => !tempObj.hasOwnProperty(key));
  if(missingKeys.length){
    console.warn(`
WARNING: Locale "${locale}" is missing keys. The en-US locale will fill the gaps:
 * ${missingKeys.join("\n * ")}
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
 * @param  {[type]} text Text to be processed.
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
    .forEach(
      nameValue => result[nameValue.shift().trim()] = nameValue.shift().trim()
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
    .forEach(
      nameValue => result[nameValue.shift().trim()] = nameValue.shift()
    );
  return result;
}
/**
 * Reads file from path.
 * @param  {String} file Path to file.
 * @return {Promise<String>} The data that was read from disk.
 */
function readFile(file){
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
 * Runs through the locales, downloads the data, and saves it.
 *
 * @param  {String[]} allLocales The list of locales to download.
 */
function generateL10NStrings(allLocales){
  allLocales
    .map(locale => new StringBundle(locale))
    .forEach(bundle => bundle.save());
}

//Read the default locale data (en-US)
Promise.all([
  readFile(l10nPath + "/global.dtd").then(processDTD),
  readFile(l10nPath + "/newTab.properties").then(processProps),
  readFile(l10nPath + "/newTab.dtd").then(processDTD),
])
.then(
  defaultStrings => Object.assign(defaultStrings.shift(), defaultStrings.shift())
)
.then(
  resultingObject => Object.assign(defaultLocale, resultingObject)
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

