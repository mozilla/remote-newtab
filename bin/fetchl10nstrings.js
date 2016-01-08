#! /usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/**
 * Create the string bundles and then save them to disk.
 */
/*jshint node:true, browser:false, esnext:true*/
"use strict";
const async = require("marcosc-async");
const fs = require("fs");
const path = require("path");
const clc = require("cli-color");
const fetch = require("node-fetch"); // jshint ignore:line
const repo = "https://hg.mozilla.org/releases/l10n/mozilla-aurora/";
const newTabPath = "/raw-file/tip/browser/chrome/browser/newTab";
const globalDirPath = "/raw-file/tip/dom/chrome/global.dtd";
const l10nPath = path.resolve(`${__dirname}/../l10n/`);
let defaultLocale;

// CLI-Colors
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;

function fetchAndProcessTask(processor) {
  return async(function*(url) {
    let response = yield assureResponse(yield fetch(url));
    let text = yield response.text();
    return processor(text);
  });
}

// Curried functions, reduce duplicate code.
const dtdProcessorTask = fetchAndProcessTask(processDTD);
const propProcessorsTask = fetchAndProcessTask(processProps);

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
    return `${repo}${this.locale}${newTabPath}.properties`;
  },
  get dtd() {
    return `${repo}${this.locale}${newTabPath}.dtd`;
  },
  get dir() {
    return `${repo}${this.locale}${globalDirPath}`;
  },
  /**
   * Saves the bundle to disk.
   *
   * @return {Promise} Resolves once writing to disk is done is done.
   */
  save() {
    return async.task(function*() {
      // Kick-off downloads
      let processedStrings = yield Promise.all([
        dtdProcessorTask(this.dir),
        dtdProcessorTask(this.dtd),
        propProcessorsTask(this.properties)
      ]);
      let localeMap = processedStrings.reduce(toSingleMap, new Map());
      checkForMissingKeys(localeMap, this.locale);

      let defaultClone = new Map(Array.from(defaultLocale.entries()));
      // Fill in gaps
      let dirtyMap = toSingleMap(defaultClone, localeMap);
      let canonicalKeys = Array.from(defaultLocale.keys());
      let trimmedMap = trimRedundantProps(dirtyMap, canonicalKeys, this.locale);
      let sortedMap = toSortedMap(trimmedMap);
      let text = "";
      try {
        text = JSON.stringify(sortedMap, mapReplacer, 2);
      }catch (err) {
        let msg = error("Error parsing JSON of ${this.locale}. Please fix this!");
        console.error(msg);
      }
      yield writeToDisk(text, this.locale);
    }, this);
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
    // All is good!
    return Promise.resolve(response);
  }
  // Otherwise, let's try to recover.
  return new Promise(function(resolve, reject) {
    let msg = "";
    switch (response.status) {
    case 503:
      msg = warn(`We got a 503 for: ${response.url} - trying again.`);
      console.warn(msg);
      setTimeout(() => {
        fetch(response.url)
          .then(assureResponse)
          .then(resolve);
      }, 2000);
      break;
    case 404:
      msg = warn(`l10n File is 404 : ${response.url}`);
      console.warn(msg);
      // Node Response doesn't expose constructor, so fake it till you make it!
      const fakeResponse = {
        text() {
          return Promise.resolve("");
        }
      };
      resolve(fakeResponse);
      break;
    default:
      msg = error(`Could not handle ${response.status} for: ${response.url}`);
      reject(new Error(msg));
    }
  });
}
/**
 * Validate the data against the canonical default object.
 * Invalid properties are logged via console.log.
 *
 * @param  {Map} results results to be validated.
 * @param  {String} locale The corresponding locale.
 * @return {Object[]} the validated (unmodified) results.
 */
function checkForMissingKeys(results, locale) {
  let missingKeys = Array.from(defaultLocale.keys())
    .filter(key => !results.has(key));
  if (missingKeys.length) {
    console.warn(`
${warn("WARNING:")} Locale "${locale}" is missing keys. The en-US locale will fill the gaps:
 ${notice("* " + missingKeys.join("\n * "))}`);
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
  return text.split("\n")
    .filter(line => line.trim().startsWith("<!ENTITY"))
    .map(
      line => line.replace("<!ENTITY ", "")
      .replace(">", "")
      .replace(/\"/g, "")
      .split(/\s(.+)?/)
      .filter(item => item)
    )
    .map(cleanUpNameValuePairs)
    .reduce(toMap, new Map());
}
/**
 * Reduces key value pairs into a Map.
 *
 * @param  {Map} map The map to reduce into.
 * @param  {String[]} nameValue The name/value pair to add to the map.
 * @return {Object} The resulting (original) object.
 */
function toMap(map, nameValue) {
  let name = nameValue[0];
  let value = nameValue[1];
  map.set(name, value);
  return map;
}
/**
 * Trims names and replaces "." for "-"; trims values.
 *
 * @param  {String[]} item A name value pair
 * @return {String[]} An new Array with the modified values
 */
function cleanUpNameValuePairs(item) {
  return [
    item[0].trim().replace(/\./g, "-"),
    item[1].trim(),
  ];
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
  return text.split("\n")
    .filter(line => !line.startsWith("#") && line.trim(line))
    .map(line => line.split(/=(.+)?/))
    .map(cleanUpNameValuePairs)
    .reduce(toMap, new Map());
}
/**
 * Run only a few network requests at a time.
 *
 * @param {StringBundle[]} stringBundles the string bundles to save.
 * @param {Number} throughPut  How many network requests to perform simultaneously.
 */
function* fetchRunner(stringBundles, throughPut) { // jshint ignore:line
  // Gather N=throughPut requests, and wait until they are done before continuing.
  for (let i = 0; i < stringBundles.length;) {
    let bundles = [];
    for (let j = 0; j < throughPut; j++) {
      bundles.push(stringBundles[i++]);
      if (i >= stringBundles.length) {
        break;
      }
    }
    yield Promise.all(
      bundles.map(bundle => bundle.save())
    );
  }
}

/**
 * Runs through the locales, downloads the data, and saves it.
 *
 * @param {String[]} allLocales The list of locales to download.
 */
function generateL10NStrings(allLocales) {
  let stringBundles = allLocales
    .map(locale => new StringBundle(locale));
  let runner = fetchRunner(stringBundles, 5);
  let fetchSequentially = () => {
    let next = runner.next();
    if (!next.done) {
      return next.value.then(fetchSequentially);
    }
  };
  // Fetch a few at a time, otherwise server might get upset
  fetchSequentially();
}
/**
 * Trims properties that are not used in the about:newtab page.
 *
 * @param  {Map} map The map to trip props from.
 * @param  {String[]} canonicalList The list of canonical properties.
 * @param  {String} locale The locale being trimmed, for reporting.
 * @return {Map} The map
 */
function trimRedundantProps(map, canonicalList, locale) {
  let localeMap = new Map(Array.from(map.entries()));
  let redudantProps = Array.from(localeMap.keys())
    .filter(key => canonicalList.indexOf(key) === -1);
  if (redudantProps.length) {
    let msg = `
${warn("WARNING:")} Redundant props in ${locale}:`; // jshint ignore:line
    msg += notice(`
 * ${redudantProps.join("\n * ")}
`);
    console.warn(msg);
  }
  redudantProps.forEach(
    key => localeMap.delete(key)
  );
  return localeMap;
}
/**
 * Reducer: merges entries of one map into another.
 *
 * @param  {Map} prevMap The map that will be added to.
 * @param  {Map} nextMap The map where the new props will come from.
 * @return {Map} The prevMap, with the added properties.
 */
function toSingleMap(prevMap, nextMap) {
  Array
    .from(nextMap.entries())
    .forEach(entry => prevMap.set(entry[0], entry[1]));
  return prevMap;
}
/**
 * Creates a sorted Map.
 *
 * @param  {Map} unsortedMap The map to be sorted
 * @return {Map} A new map, that has been sorted.
 */
function toSortedMap(unsortedMap) {
  return Array.from(unsortedMap.keys())
    .sort()
    .reduce(
      (prev, next) => {
        prev.set(next, unsortedMap.get(next));
        return prev;
      }, new Map()
    );
}
/**
 * When JSON.stringify(), replaces a map for its key values.
 *
 * @param  {String} key The key to check.
 * @param  {Any} value The corresponding value.
 * @return {String} The replaced string.
 */
function mapReplacer(key, value) { // jshint ignore:line
  if (!(value instanceof Map)) {
    return value;
  }
  let result = Array.from(value.entries())
    .map(keyValue => {
      let key = keyValue[0];
      let value = String(keyValue[1]).replace(/\"/g,`\\"`).trim();
      return `"${key}": "${value}"`;
    })
    .reduce(
      // Reduce "{", then each entry, and finally "}"
      (prev, next, i, arr) => `${prev}${next}${(i < arr.length - 1) ? "," : "}"}`  , "{"
    );
  return JSON.parse(result);
}
// Read the default locale data (en-US), get the "shipped locales",
// and save it all to disk!
async.task(function*() {
  const mozCentral = "https://hg.mozilla.org/mozilla-central/raw-file/tip/";
  const mozAurora = "https://hg.mozilla.org/releases/mozilla-aurora/raw-file/tip/";
  const newTabDTD = `${mozCentral}browser/locales/en-US/chrome/browser/newTab.dtd`;
  const newTabProps = `${mozCentral}browser/locales/en-US/chrome/browser/newTab.properties`;
  const globalDTD = "https://hg.mozilla.org/releases/l10n/mozilla-aurora/an/raw-file/tip/dom/chrome/global.dtd";
  const localeMaps = yield Promise.all([
    dtdProcessorTask(newTabDTD),
    propProcessorsTask(newTabProps),
    dtdProcessorTask(globalDTD),
  ]);
  defaultLocale = toSortedMap(localeMaps.reduce(toSingleMap, new Map()));
  // Save the default locale
  let data = JSON.stringify(defaultLocale, mapReplacer, 2);
  yield writeToDisk(data, "en-US");
  let response = yield fetch(`${mozAurora}browser/locales/shipped-locales`);
  let rawLocales = yield response.text();
  //Remove default locale en-US, and discard OS specific invalid tags (e.g., "linux win32")
  let allLocales = rawLocales.split("\n")
    .filter(locale => locale && locale !== "en-US")
    .map(locale => locale.split(/\s/)[0]);
  try {
    generateL10NStrings(allLocales);
  } catch (err) {
    console.error(error(err));
  }
}).catch(err => console.log(err));
