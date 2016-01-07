#! /usr/bin/env node
"use strict";
const fs = require("fs");
const exec = require("child_process").exec;
const fileName = "www/mainSiteURLs.json";

function fileFinder(dir, pattern) {
  return new Promise((resolve, reject) => {
    var command = `find ${dir} ${pattern}`;
    exec(command, (err, stdout) => {
      return (err) ? reject(err) : resolve(stdout);
    });
  });
}

function processResults(results) {
  const paths = results
    .split("\n")
    .filter(item => item)
    .map(item => item.replace(/^www\//, "./"))
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
fileFinder(`www`, `-iname "*.js" -or -iname "*.css" -or -iname "*.svg" -or -iname "*.png" `)
  .then(processResults)
  .then(writeFile)
  .catch(err => console.error(err));
