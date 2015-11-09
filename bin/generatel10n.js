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
// CLI-Colors
const error = clc.red.bold;
const warn = clc.yellow;
const notice = clc.blue;


function readFile(file){
  return new Promise((resolve,reject)=>{
    fs.readFile(file, "utf-8", (error, data) => {
      return (error) ? reject(error) : resolve({path: file, data: data});
   });
  });
}

function writeFile(file, data){
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err) => {
     return (err) ? reject(err) : resolve(); 
    });
  });
}

// Load template
readFile(htmlSource)
  .then(
    file => handlebars.compile(file.data)
  )
  .then(
    createLocalizedHTMLFiles
  );

function createLocalizedHTMLFiles(template){
  let readPromises = fs.readdirSync(l10nPath)
    // Only Directories
    .filter(
      file => fs.statSync(path.join(l10nPath, file)).isDirectory()
    )
    // Add file names
    .map(
      dir => path.join(l10nPath, dir + "/strings.json")
    )
    // Read the files from disk
    .map(
      stringFile => readFile(stringFile)
    );
  return Promise.all(readPromises)
    .then(
      textFiles => textFiles.map(file => new HTMLFile(file, template))
    )
    .then(
      htmlFiles => htmlFiles.map(file => file.save())
    )
    .then(
      () => console.log(notice("Done!"))
    )
    .catch(
      err => console.error(error(err))
    )
}

function HTMLFile(stringFile, template){
  let splitPath = stringFile.path.split("/");
  let locale = splitPath[splitPath.length - 2];
  const outDir = path.resolve(`${__dirname}/../build/${locale}/`);
  this.save = function(){
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }
    let html = template(JSON.parse(stringFile.data));
    let dest = `${outDir}/index.html`;
    return writeFile(dest, html);
  }
}


// Promise
//   .all([templatePromise, dataPromise])
//   .then(generateHTML)
//   .catch(err => console.log(err))

// // function generateHTML(things){
// //   var source = things[0];
// //   var data = JSON.parse(things[1]);

// //   var html = template(data);
// // }





