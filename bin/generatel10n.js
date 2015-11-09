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
const handlebars = require("handlebars");
const l10nPath = path.resolve(`${__dirname}/../l10n/`);
const htmlSource = path.resolve(`${__dirname}/../src/index.html`);
const l10nFiles = fs.readdirSync(l10nPath)
  // Only Directories
  .filter(
    file => fs.statSync(path.join(l10nPath, file)).isDirectory()
  )
  // Add file name
  .map(
    dir => path.join(l10nPath, dir + "/strings.json")
  );

// CLI-Colors
const error = clc.red.bold;

/**
 * Promised version of fs.readFile.
 *
 * @param  {String} file File path.
 * @return {Promise} Resolves once the file writes, of rejects if error.
 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf-8", (error, data) => {
      return (error) ? reject(error) : resolve({
        path: file,
        data: data,
      });
    });
  });
}
/**
 * Promised version of fs.readFile.
 *
 * @param  {String} file File path.
 * @return {Promise} Resolves once the file reads, of rejects if error.
 */
function writeFile(file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err) => {
      return (err) ? reject(err) : resolve();
    });
  });
}
/**
 * Copies a l10n string file to the build directory.
 *
 * @param  {String} pathname The file to copy.
 * @return {Promise} The promise corresponding to the write operation.
 */
function copyStringToBuildDir(pathname) {
  let splitPath = pathname.split("/");
  let locale = splitPath[splitPath.length - 2];
  let outDir = path.resolve(`${__dirname}/../build/${locale}/locale/`);
  let filePath = outDir + "/strings.json";
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }
  return readFile(pathname)
    .then(
      file => writeFile(filePath, file.data)
    );
}
/**
 * Generates and saves the HTML files to disk.
 *
 * @param  {Template} template A compiled template, as per HandleBars API.
 * @return {Promise}  Resolves once writing all the files to disk is done.
 */
function createLocalizedHTMLFiles(template) {
  // Read the files from disk
  let readPromises = l10nFiles.map(
      stringFile => readFile(stringFile)
    );
  return Promise.all(readPromises)
    // Create a bunch of HTML file wrappers
    .then(
      textFiles => textFiles.map(file => new HTMLFile(file, template))
    )
    // Write all the files to disk, resulting in a list of promises
    .then(
      htmlFiles => htmlFiles.map(file => file.save())
    );
}
/**
 * Helper class, represents a HTML file to save to disk.
 *
 * @param {Object} stringFile Object representing a file.
 * @param {Template} template A compiled Mustache template.
 */
function HTMLFile(stringFile, template) {
  let splitPath = stringFile.path.split("/");
  let locale = splitPath[splitPath.length - 2];
  const outDir = path.resolve(`${__dirname}/../build/${locale}/`);
  this.save = function() {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }
    let html = template(JSON.parse(stringFile.data));
    let dest = `${outDir}/index.html`;
    return writeFile(dest, html);
  };
}

// We first read the HTML as a Handlebars template
// then we create all the localized HTML files.
readFile(htmlSource)
  .then(
    file => handlebars.compile(file.data)
  )
  .then(
    createLocalizedHTMLFiles
  )
  .catch(
    err => console.error("Error creating localized files", error(err))
  )
  .then(
    () => l10nFiles.map(copyStringToBuildDir)
  )
  .then(
    writePromises => Promise.all(writePromises)
  )
  .catch(
    err => console.log(err)
  );
