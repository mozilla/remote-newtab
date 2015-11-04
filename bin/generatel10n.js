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

const locales = [
  "ach", "af", "ak", "ar", "as", "ast", "be", "bg", "bn-BD", "bn-IN", "br",
  "bs", "ca", "cs", "cy", "da", "de", "el", "en-GB", "en-ZA", "eo", "es-AR",
  "es-CL", "es-ES", "es-MX", "et", "eu", "fa", "ff", "fi", "fr", "fy-NL",
  "ga-IE", "gd", "gl", "gu-IN", "he", "hi-IN", "hr", "hu", "hy-AM", "id",
  "is", "it", "ja", "ja-JP-mac", "ka", "kk", "km", "kn", "ko", "ku", "lg",
  "lij", "lt", "lv", "mai", "mk", "ml", "mn", "mr", "ms", "my", "nb-NO",
  "ne-NP", "nl", "nn-NO", "nr", "nso", "oc", "or", "pa-IN", "pl", "pt-BR",
  "pt-PT", "rm", "ro", "ru", "rw", "si", "sk", "sl", "son", "sq", "sr", "ss",
  "st", "sv-SE", "ta", "ta-LK", "te", "th", "tn", "tr", "ts", "uk", "ve", "vi",
  "wo", "x-testing", "xh", "zh-CN", "zh-TW", "zu",
];

const repo = "http://mxr.mozilla.org/l10n-central/source/";
const serverPath = "/browser/chrome/browser/newTab";
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
    return `${repo}${this.locale}${serverPath}.properties?raw=1`;
  },
  get dtd() {
    return `${repo}${this.locale}${serverPath}.dtd?raw=1`;
  },
  /**
   * Saves the bundle to disk.
   * @return {Promise} Resolves once writing to disk is done is done.
   */
  save() {
    var dtdPromise = fetch(this.dtd).then(r => r.text())
      .then(processDTD);
    var textPromise = fetch(this.properties).then(r => r.text())
      .then(processProps);
    return Promise.all([dtdPromise, textPromise])
      // Reduce resulting objects into a single object.
      .then(results => results.reduce(
        (prev, next) => Object.assign(prev, next), {}))
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
/**
 * Writes the resulting JSON to the file system.
 *
 * @param  {String} data   The string to write to disk.
 * @param  {String} locale The locale that this data is for.
 * @return {Promise} Resolves when writing is done.
 */
function writeToDisk(data, locale) {
  return new Promise((resolve, reject) => {
    let dir = path.resolve(`__dirname/../l10n/${locale}/`);
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
  var result = {};
  text.split("\n")
    .filter(line => line.trim().startsWith("<!ENTITY"))
    .map(
      line => line.replace("<!ENTITY ", "")
      .replace(">", "")
      .replace(/\"/g, "")
      .split(/\s(.+)?/)
      .filter(item => item)
    )
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
  var result = {};
  text
    .split("\n")
    .filter(line => !line.startsWith("#") && line.trim(line))
    .map(line => line.split(/=(.+)?/))
    .forEach(nameValue => result[nameValue.shift()] = nameValue.shift());
  return result;
}

locales.map(locale => new StringBundle(locale))
  .forEach(bundle => bundle.save());
