#! /usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/**
 * Moves the site files, and performs localization on a per release channel basis.
 * How it works, for each of the release train channels:
 *
 *    1. it sets up the appropriate directory structure:
 *      ./build/version/channel/locale/
 *
 *    2. it copies over the files:
 *      - the service worker.
 *      - the js and css folders
 *
 *    3. Performs localization on HTML template (src/lang-tag/index.html)
 *       using Handlebars.
 *
 *    4. Copies the localized HTML to the appropriate version/channel locale
 *       directory.
 *
 *  Files that don't need to be localized are just placed at the
 *  "channel" level, so to avoid duplication. For example, there sw.js:
 *   ./build/v2/nightly/sw.js
 *
 *  Localized HTML and the string.json files, then gets place in:
 *    ./build/v2/nightly/ach/index.html
 *    ./build/v2/aurora/ach/locale/strings.json
 *
 */
/*jshint node:true, esnext: true*/
"use strict";
const async = require("marcosc-async");
const path = require("path");
const fetch = require("node-fetch"); // jshint ignore:line
const fse = require("fs-extra");
const handlebars = require("handlebars");
const baseSrcDir = path.resolve(`${__dirname}/../src`);
const outBaseDir = path.resolve(`${__dirname}/../build`);
const l10nBaseDir = path.resolve(`${__dirname}/../l10n`);
const version = "v2";
/**
 * Tasks to be performed, in no particular order.
 *
 * @type {Object}
 */
const Tasks = {
  /**
  * Downloads the list of shipping locales from Aurora's repo.
  *
  * @return {Promise<String[]>} Resolves with the locales.
  */
  fetchLocales() {
    const mozAurora = "https://hg.mozilla.org/releases/mozilla-aurora/raw-file/tip/";
    return async.task(function*() {
      // Get shipping locales
      let response = yield fetch(`${mozAurora}browser/locales/shipped-locales`);
      let text = yield response.text();
      // Discard OS-specific invalid language tags (e.g., "linux win32")
      let locales = text.split("\n")
        .filter(locale => locale)
        .map(locale => locale.split(/\s/)[0]);
      return locales;
    },this);
  },
  /**
   * Promise wrapper for emptying a directory.
   *
   * @param  {String} dir The directory to empty (ensures the directory exists).
   * @return {Promise} resolves when operation completes.
   * @see https://github.com/jprichardson/node-fs-extra#emptydirdir-callback
   */
  emptyDir(dir) {
    return new Promise((resolve, reject)=> {
      fse.emptyDir(dir, (err) => {
        return (err) ? reject(err) : resolve();
      });
    });
  },
  /**
   * Copy a file or the contents of a folder.
   *
   * @param  {String} src  The source path.
   * @param  {String} dest The destination path.
   * @return {Promise}     Resolves when operation completes.
   * @see https://github.com/jprichardson/node-fs-extra#copy
   */
  copy(src, dest) {
    return new Promise((resolve, reject) => {
      const ops = {
        clobber: true
      };
      fse.copy(src, dest, ops, (err) => {
        return (err) ? reject(err) : resolve();
      });
    });
  },
  /**
   * Performs the localization of the site.
   *
   * @param  {String[]} channels A list of git channels.
   * @return {Promise} Resolves when all operations complete.
   */
  doLocalization(channels) {
    function makeLocaleStruct(locale, channel) {
      let obj = {
        src: `${l10nBaseDir}/${locale}/`,
        dest: `${outBaseDir}/${version}/${channel}/${locale}/locale/`,
      };
      return obj;
    }
    return async.task(function*() {
      const locales = yield this.fetchLocales();
      // Makes an array of objects that contain {src: path, dest: path}.
      const sources = channels.map(
          channel => locales.map((locale) => makeLocaleStruct(locale, channel))
        // Reduce to a single array
        ).reduce(
          (prev, next) => prev.concat(next), []
        );
      const templatePath = `${baseSrcDir}/lang-tag/index.html`;
      const rawTemplate = yield this.readFile(templatePath);
      const template = handlebars.compile(rawTemplate.data);
      for (let source of sources) {
        yield this.ensureDir(source.dest);
        // copy string.json files
        let stringsSrc = `${source.src}strings.json`;
        let stringDest = `${source.dest}strings.json`;
        yield this.copy(stringsSrc, stringDest);
        // Localize HTML using the JSON string
        let file = yield this.readFile(stringDest);
        let html = template(file.json);
        let dest = path.resolve(source.dest, "../index.html");
        yield this.writeFile(dest, html);
      }
    }, this);
  },
  /**
   * Promised version of fse.writeFile().
   *
   * @param  {String} file File path.
   * @return {Promise} Resolves once the file reads, of rejects if error.
   */
  writeFile(file, data) {
    return new Promise((resolve, reject) => {
      fse.writeFile(file, data, (err) => {
        return (err) ? reject(err) : resolve();
      });
    });
  },
  /**
   * Promised version of fse.readFile().
   *
   * @param  {String} file File path.
   * @return {Promise} Resolves once the file writes, of rejects if error.
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      fse.readFile(file, "utf-8", (error, data) => {
        return (error) ? reject(error) : resolve({
          path: file,
          data: data,
          get json(){
            return JSON.parse(this.data);
          }
        });
      });
    });
  },
  /**
   * Wrapper for fse.ensureDir().
   * Ensures that the directory exists. If the directory structure does not
   * exist, it is created.
   *
   * @param  {String} dir The directory to ensure.
   * @return {Promise} Resolves when operation is complete, rejects on error.
   * @see https://github.com/jprichardson/node-fs-extra#ensuredirdir-callback
   */
  ensureDir(dir) {
    return new Promise((resolve, reject)=> {
      fse.ensureDir(dir, (err) => {
        return (err) ? reject(err) : resolve();
      });
    });
  },
  /**
   * Copy a single file or folder to multiple folders.
   *
   * @param  {String} source     The file or folder to copy.
   * @param  {String[]} channels The git channels to use.
   * @return {Promise} Resolves when all copy operations are complete.
   */
  copyToDirs(source, channels) {
    return async.task(function*() {
      for (let channel of channels) {
        let dest = `${outBaseDir}/${version}/${channel}/`;
        yield this.ensureDir(dest);
        dest += path.basename(source);
        let stat = fse.lstatSync(source);
        if (stat.isDirectory()) {
          dest += "/";
        }
        yield this.copy(source, dest);
      }
    }, this);
  },
};
/**
 * Copy sites files to build directory + perform localization.
 * See top of this document for a more detailed description of how it
 * all works.
 */
async.task(function*() {
  const channels = ["nightly", "aurora", "beta", "release", "esr"];
  // Trash the build directory.
  yield Tasks.emptyDir(outBaseDir);
  // Move the sw, js, and css.
  yield Tasks.copyToDirs(`${baseSrcDir}/sw.js`, channels);
  yield Tasks.copyToDirs(`${baseSrcDir}/css/`, channels);
  yield Tasks.copyToDirs(`${baseSrcDir}/js/`, channels);
  // Do the localization.
  yield Tasks.doLocalization(channels);
})
  .catch(err => console.log(err));
