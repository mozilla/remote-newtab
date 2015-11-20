/*globals module*/
// Karma configuration
// Generated on Thu Aug 13 2015 23:57:08 GMT-0400 (EDT)

module.exports = function(config) {
  "use strict";
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["mocha", "chai-as-promised", "chai", "express-http-server"],

    // list of files / patterns to load in the browser
    files: [{
        pattern: "src/sw.js",
        served: true,
        watched: true,
        included: false,
      },
      "src/js/pinnedLinks.js",
      "src/js/userDatabase.js",
      "src/js/lib/async.js",
      "src/js/lib/cachetasks.js",
      "src/js/blockedLinks.js",
      "src/js/rectangle.js",
      "src/test/fixtures/**/*.html",
      "src/test/**/*.js", {
        pattern: "src/css/**/*.*",
        watched: true,
        served: true,
        included: false
      }, {
        pattern: "src/js/**/*.js",
        watched: true,
        served: true,
        included: false
      }, {
        pattern: "src/js/**/*.json",
        watched: true,
        served: true,
        included: false
      },
    ],

    customHeaders: [{
      match: ".*",
      name: "Service-Worker-Allowed",
      value: "/"
    },
  ],

    proxies: {
      '/sw.js': 'http://localhost:9876/base/src/sw.js',
      "/css/contentSearchUI.css": "http://localhost:9876/base/src/css/contentSearchUI.css",
      "/css/images/close.png": "http://localhost:9876/base/src/css/images/close.png",
      "/css/images/controls.svg": "http://localhost:9876/base/src/css/images/controls.svg",
      "/css/images/defaultFavicon.png": "http://localhost:9876/base/src/css/images/defaultFavicon.png",
      "/css/images/history-icon.svg": "http://localhost:9876/base/src/css/images/history-icon.svg",
      "/css/images/search-engine-placeholder.png": "http://localhost:9876/base/src/css/images/search-engine-placeholder.png",
      "/css/images/search-arrow-go.svg": "http://localhost:9876/base/src/css/images/search-arrow-go.svg",
      "/css/images/search-indicator-magnifying-glass.svg": "http://localhost:9876/base/src/css/images/search-indicator-magnifying-glass.svg",
      "/css/images/shared-menu-check.svg": "http://localhost:9876/base/src/css/images/shared-menu-check.svg",
      "/css/images/whimsycorn.png": "http://localhost:9876/base/src/css/images/whimsycorn.png",
      "/css/newTab.css": "http://localhost:9876/base/src/css/newTab.css",

      "/index.html": "http://localhost:9876/base/src/index.html",
      "/js/blockedLinks.js": "http://localhost:9876/base/src/js/blockedLinks.js",
      "/js/cells.js": "http://localhost:9876/base/src/js/cells.js",
      "/js/contentSearchUI.js": "http://localhost:9876/base/src/js/contentSearchUI.js",
      "/js/customize.js": "http://localhost:9876/base/src/js/customize.js",
      "/js/drag.js": "http://localhost:9876/base/src/js/drag.js",
      "/js/dragDataHelper.js": "http://localhost:9876/base/src/js/dragDataHelper.js",
      "/js/drop.js": "http://localhost:9876/base/src/js/drop.js",
      "/js/dropPreview.js": "http://localhost:9876/base/src/js/dropPreview.js",
      "/js/dropTargetShim.js": "http://localhost:9876/base/src/js/dropTargetShim.js",
      "/js/grid.js": "http://localhost:9876/base/src/js/grid.js",
      "/js/intro.js": "http://localhost:9876/base/src/js/intro.js",
      "/js/lib/async.js": "http://localhost:9876/base/src/js/lib/async.js",
      "/js/lib/cachetasks.js": "http://localhost:9876/base/src/js/lib/cachetasks.js",
      "/js/mainSiteURLs.json": "http://localhost:9876/base/src/js/mainSiteURLs.json",
      "/js/newTab.js": "http://localhost:9876/base/src/js/newTab.js",
      "/js/page.js": "http://localhost:9876/base/src/js/page.js",
      "/js/pinnedLinks.js": "http://localhost:9876/base/src/js/pinnedLinks.js",
      "/js/rectangle.js": "http://localhost:9876/base/src/js/rectangle.js",
      "/js/search.js": "http://localhost:9876/base/src/js/search.js",
      "/js/sites.js": "http://localhost:9876/base/src/js/sites.js",
      "/js/transformations.js": "http://localhost:9876/base/src/js/transformations.js",
      "/js/undo.js": "http://localhost:9876/base/src/js/undo.js",
      "/js/updater.js": "http://localhost:9876/base/src/js/updater.js",
      "/js/userDatabase.js": "http://localhost:9876/base/src/js/userDatabase.js",
      "/test/rectangle.js": "http://localhost:9876/base/src/test/rectangle.js",
      "/test/script_test_example.js": "http://localhost:9876/base/src/test/script_test_example.js",
      "/test/sw_spec.js": "http://localhost:9876/base/src/test/sw_spec.js",
      "/test/test.js": "http://localhost:9876/base/src/test/test.js",
    },

    // list of files to exclude
    exclude: [
      "**/*.swp",
      "*.swp",
      ".DS_Store"
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "src/js/**/*.js": ["coverage"],
      "src/test/fixtures/**/*.html": ["html2js"],
    },

    // test results reporter to use
    // possible values: "dots", "progress"
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress", "coverage", "coveralls"],

    coverageReporter: {
      dir: "logs/reports/coverage",
      reporters: [{
        type: "lcov",
        subdir: "lcov"
      }, {
        type: "html",
        subdir: "html"
      }, {
        type: "text",
        subdir: ".",
        file: "text.txt"
      }, {
        type: "text-summary",
        subdir: ".",
        file: "text-summary.txt"
      }]
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["SWNightly"],

    customLaunchers: {
      SWNightly: {
        base: "FirefoxNightly",
        prefs: {
          "browser.dom.window.dump.enabled": true,
          "browser.newtabpage.enhanced": true,
          "browser.newtabpage.introShown": true,
          "browser.newtabpage.updateIntroShown": true,
          "devtools.chrome.enabled": true,
          "devtools.debugger.prompt-connection": false,
          "devtools.debugger.remote-enabled": true,
          "devtools.debugger.workers": true,
          "devtools.serviceWorkers.testing.enabled": true,
          "devtools.webconsole.filter.serviceworkers": true,
          "dom.serviceWorkers.enabled": true,
          "dom.serviceWorkers.exemptFromPerDomainMax": true,
          "dom.serviceWorkers.interception.opaque.enabled": true,
        }
      }
    },

    expressHttpServer: {
      port: 9999,
      // this function takes express app object and allows you to modify it
      // to your liking. For more see http://expressjs.com/4x/api.html
      appVisitor(app) {
        //CORS middleware
        var cors = require('cors');
        var corsOptions = {
          origin: '*',
          allowedHeaders: "statusoverride"
        };
        app.use(cors(corsOptions));
        app.options('/update-tests', cors(corsOptions));
        app.get('/update-tests', (req, res) => {
          if (req.get("statusoverride")) {
            res.status(req.get("statusoverride"));
          }
          res.set("ReponseFrom", "server");
          res.send("<meta charset=utf8><h1>This is a test</h1>");
        });
      }
    },

    browserNoActivityTimeout: 10000,

    browserDisconnectTimeout: 2000,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};

