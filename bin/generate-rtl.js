#! /usr/bin/env node
"use strict";
const path = require("path");
const fs = require("fs");
const cssjanus = require("cssjanus");

const FILE_NAME = path.join(__dirname, "../www/main-rtl.css");
const FILE_PATH = path.join(__dirname, "../www/main.css");

function convertCSS(filePath) {
    const data = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(FILE_NAME, cssjanus.transform(data), "utf8");
}

convertCSS(FILE_PATH);
