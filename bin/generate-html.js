#! /usr/bin/env node
"use strict";

function template(options) {
  const locale = options.locale;
  const paths = options.paths;
  const title = options.title;
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
   <meta name="viewport" content="width=device-width user-scalable=no" />
  <link rel="stylesheet" href="${paths.css}">
  <title>${title}</title>
</head>
<body>
  <div id="root"></div>
  <script src="${paths.localeData}"></script>
  <script src="${paths.js}"></script>
</body>
</html>
`;
}

process.stdout.write(template({
  // todo: read from args
  locale: "en-US",
  title: "New Tab",
  paths: {
    css: "./main.css",
    js: "./main.js",
    localeData: "./locale-data.js"
  }
}));
