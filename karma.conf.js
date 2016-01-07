const webpack = require('./webpack.config');

module.exports = function (config) {
  config.set({
    singleRun: true,
    browsers: ['FirefoxNightly'],
    frameworks: ['mocha'],
    reporters: ['mocha'],
    files: [
      'tests/index.js'
    ],
    preprocessors: {
     'tests/**/*.js': ['webpack', 'sourcemap']
    },
    webpack: {
      devtool: 'inline-source-map',
      resolve: webpack.resolve,
      module: {
        loaders: webpack.module.loaders
      }
    },
    webpackMiddleware: {
      noInfo: true
    }
  });
};
