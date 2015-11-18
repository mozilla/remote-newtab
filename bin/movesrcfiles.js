#! /usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/**
 * Moves the site files, and performs localization on a per release branch basis.
 * How it works, for each of the release train branches:
 *
 *    1. it checks out the appropriate branch (e.g., nightly).
 *
 *    2. it sets up the appropriate directory structure:
 *      ./build/version/branch/locale/
 *
 *    3. it copies over the files:
 *      - the service worker.
 *      - the js and css folders
 *
 *    4. Performs localization on HTML template (src/lang-tag/index.html)
 *       using Handlebars.
 *
 *    5. Copies the localized HTML to the appropriate version/branch/locale
 *       directory.
 *
 *  Best of all, files that don't need to be localized are just placed at the
 *  "branch" level, so to avoid duplication. For example, there sw.js:
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
const exec = require("child_process").exec;
const version = "v2";
let workingBranch = "gh-pages";

/**
 * Basic wrapper for performing Git operations asynchronously.
 *
 * @type {Object}
 */
const Git = {
  /**
   * Checks out a git branch.
   *
   * @param  {String} branch The branch to checkout out.
   * @return {Promise} Resolves when command is done executing.
   */
  checkout(branch) {
    return this.promisedExec(`git checkout ${branch}`);
  },
  /**
   * Gets the current branch git is on.
   *
   * @return {String} the name of the branch.
   */
  get currentBranch() {
    const command = "git rev-parse --abbrev-ref HEAD";
    return this.promisedExec(command)
      .then(r => r.trim());
  },
  /**
   * Runs a command on the OS.
   *
   * @param  {String} command The command to run.
   * @return {Promise} Resolves when command is done executing.
   */
  promisedExec(command) {
    return new Promise((resolve,reject) => {
      exec(command, (error, stdout, stderr) => {
        if (stderr) {
          console.error(stderr);
        }
        return (error) ? reject(error) : resolve(stdout);
      });
    });
  }
};

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
   * @param  {String[]} branches A list of git branches.
   * @return {Promise} Resolves when all operations complete.
   */
  doLocalization(branches) {
    function makeLocaleStruct(locale, branch) {
      let obj = {
        branch: branch,
        stringSrc: `${l10nBaseDir}/${locale}/strings.json`,
        stringDest: `${outBaseDir}/${version}/${branch}/langs/${locale}/locale/strings.json`,
      };
      return obj;
    }
    return async.task(function*() {
      // Make a simple array, containing src at 0, and destination at 1.
      const locales = yield this.fetchLocales();
      const l10nSrcAndDests = branches.map(
          branch => locales.map((locale) => makeLocaleStruct(locale, branch))
        // Reduce to a single array
        ).reduce(
          (prev, next) => prev.concat(next), []
        );
      // Copy the string.json from the right branch to the appropriate directory
      let currentBranch = yield Git.currentBranch;
      let template; // prevents template from being created over and over.
      for (let source of l10nSrcAndDests) {
        // Make sure we are on the right git branch
        if (currentBranch !== source.branch) {
          yield Git.checkout(source.branch);
          currentBranch = source.branch;
          // Load up the template for this branch
          let rawTemplate = yield this.readFile(`${baseSrcDir}/lang-tag/index.html`);
          template = handlebars.compile(rawTemplate.data);
        }
        // copy string.json files
        yield this.copy(source.stringSrc, source.stringDest);
        // Localize HTML using the JSON string
        let file = yield this.readFile(source.stringDest);
        let html = template(JSON.parse(file.data));
        let dest = path.resolve(source.stringDest, "../../index.html");
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
        });
      });
    });
  },
  /**
   * Deletes the build directories for all branches. Makes sure there is no
   * left over stuff accidentally in any of them.
   *
   * @param  {String[]} branches The git branches to operate on.
   * @param  {String} dir the directory to clean out.
   * @return {Promise} Resolves once operations have completed.
   */
  cleanBuildDirs(branches, dir) {
    return async.task(function*() {
      for (let branch of branches) {
        yield Git.checkout(branch);
        yield this.emptyDir(dir);
      }
    },this);
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
   * @param  {String[]} branches The git branches to use.
   * @return {Promise} Resolves when all copy operations are complete.
   */
  copyToDirs(source, branches) {
    return async.task(function*() {
      for (let branch of branches) {
        let dest = `${outBaseDir}/${version}/${branch}/`;
        yield Git.checkout(branch);
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
  workingBranch = yield Git.currentBranch;
  const branches = ["nightly", "aurora", "beta", "release", "esr"];
  // Trash the build directory.
  yield Tasks.cleanBuildDirs([workingBranch].concat(branches), outBaseDir);
  // Move the sw, js, and css.
  yield Tasks.copyToDirs(`${baseSrcDir}/sw.js`, branches);
  yield Tasks.copyToDirs(`${baseSrcDir}/css/`, branches);
  yield Tasks.copyToDirs(`${baseSrcDir}/js/`, branches);
  // Do the localization.
  yield Git.checkout(workingBranch);
  yield Tasks.doLocalization(branches);
  yield Git.checkout(workingBranch);
})
 .catch(err => console.log(err))
 .then(() => Git.checkout(workingBranch));
