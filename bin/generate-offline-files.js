#! /usr/bin/env node
"use strict";
const fs = require("fs");
const exec = require("child_process").exec;
const fileName = "src/js/mainSiteURLs.json";
const defaultFiles = [
  "./",
  "./locale/strings.js",
];

function fileFinder(dir, pattern) {
  return new Promise((resolve, reject) => {
    var command = `find ${dir} ${pattern}`;
    exec(command, (err, stdout) => {
      return (err) ? reject(err) : resolve(stdout);
    });
  });
}

// Find css and JS files
const findJs = fileFinder(`src/js`, `-iname "*.js"`);
const findCss = fileFinder(`src/css`, `-iname "*.css" -or -iname "*.svg" -or -iname "*.png"`);

function processResults(results) {
  const paths = results
    .reduce((current, next) => next.concat(current), [])
    .split("\n")
    .filter(item => item)
    .map(item => item.replace(/^src\//, "/"))
    .concat(defaultFiles)
    .sort();
  return JSON.stringify(paths, null, 2);
}

function writeFile(template) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, template, (err) => {
      return (err) ? reject(err) : resolve();
    });
  });
}

// Process and generate file
Promise.all([findJs, findCss])
  .then(processResults)
  .then(writeFile)
  .catch(err => console.error(err));
