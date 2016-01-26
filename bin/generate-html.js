#! /usr/bin/env node
"use strict";
const defaults = {
  locale: "en-US",
  title: "New Tab",
  cssPath: "./main.css",
  jsPath: "./main.js",
  localeDataPath: "./locale-data.js",
  localeDir: "ltr"
};

function template(rawOptions) {
  if (defaults.localeDir === "rtl") {
    defaults.cssPath = "./main-rtl.css";
  }
  const options = Object.assign({}, defaults, rawOptions || {});
  return `
<!DOCTYPE html>
<html dir="${options.localeDir}" lang="${options.locale}">
<head>
  <meta charset="utf-8">
   <meta name="viewport" content="width=device-width user-scalable=no" />
  <link rel="stylesheet" href="${options.cssPath}">
  <title>${options.title}</title>
</head>
<body>
  <div id="root"></div>
  <script src="${options.localeDataPath}"></script>
  <script src="${options.jsPath}"></script>
</body>
</html>
`;
};

module.exports = template;

if (require.main === module)  {
  // called from command line
  const args = require("minimist")(process.argv.slice(2), {
    alias: {locale: "l", title: "t"}
  });
  process.stdout.write(template(args));
}
