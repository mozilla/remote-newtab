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
    frameworks: ["mocha", "chai-as-promised", "chai"],

    // list of files / patterns to load in the browser

    files: [{
        pattern: "sw.js",
        served: true,
        watched: true,
        included: false,
      },
      "js/pinnedLinks.js",
      "js/userDatabase.js",
      "js/lib/async.js",
      "js/lib/cachetasks.js",
      "js/blockedLinks.js",
      "js/rectangle.js",
      "js/lib/swMessage.js",
      "test/fixtures/**/*.html",
      "test/**/*.js", {
        pattern: "css/**/*.*",
        watched: true,
        served: true,
        included: false
      }, {
        pattern: "js/**/*.js",
        watched: true,
        served: true,
        included: false
      }, {
        pattern: "locale/newTab.js",
        watched: true,
        served: true,
        included: false
      },
    ],

    proxies: {
      "/sw.js": "http://localhost:9876/base/sw.js",
      "/css/": "http://localhost:9876/base/css/",
      "/js/": "http://localhost:9876/base/js/",
      "/locale/": "http://localhost:9876/base/locale/",
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
      "js/**/*.js": ["coverage"],
      "test/fixtures/**/*.html": ["html2js"],
    },

    // test results reporter to use
    // possible values: "dots", "progress"
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress", "coverage", "coveralls"],

    coverageReporter: {
      dir: "build/reports/coverage",
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

    browserNoActivityTimeout: 10000,

    browserDisconnectTimeout: 2000,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};

