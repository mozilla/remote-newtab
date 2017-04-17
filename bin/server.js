#! /usr/bin/env node

/*jshint node:true*/
"use strict";
const path = require("path");
const express = require("express");
const app = express();
const staticSite = path.resolve(__dirname, "../src/");
const pathToSW = staticSite + "/js/sw.js";

const server = app.listen(8000, () => {
  let port = server.address().port;
  console.log(`Server at http://localhost:${port}`);
});

app.use(express.static(staticSite, {
  maxAge: "1d",
  setHeaders: function(res, path) {
    if (path === pathToSW) {
      res.setHeader("Service-Worker-Allowed", "/");
    }
  }
}));

app.disable("x-powered-by");
