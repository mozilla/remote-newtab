const WebpackNotifierPlugin = require("webpack-notifier");
const webpack = require("webpack");
const path = require("path");
const absolute = (relPath) => path.join(__dirname, relPath);

const srcDir = "./src";
const srcPath = "./src/main.js";
const distDir = "./www";
const distFilename = "main.js"

// TODO: config
const config = {
  DEVELOPMENT: true,
  LOGGING: false
};

module.exports = {
  entry: srcPath,
  output: {
    path: distDir,
    filename: distFilename,
  },
  resolve: {
    extensions: ["", ".js", ".jsx"],
    alias: {
      "components": absolute("./src/components"),
      "reducers": absolute("./src/reducers"),
      "actions": absolute("./src/actions"),
      "constants": absolute("./src/constants"),
      "lib": absolute("./src/lib"),
      "tests": absolute("./tests")
    }
  },
  devtool: "eval",
  module: {
    preLoaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "eslint"
      },
      {
        test:    /\.jsx?$/,
        exclude: [/node_modules/, /platform-placeholder\.js/],
        loader: "jscs"
      }
    ],
    loaders: [{
      test: /\.jsx?$/,
      include: /.\/(src|tests)\//,
      loader: "babel",
      query: {
        // presets: ["es2015", "react", {
        //   plugins: ["transform-object-rest-spread"]
        // }]
        presets: ["react", {
          plugins: [
            "transform-es2015-destructuring",
            "transform-es2015-parameters",
            "transform-strict-mode"
          ]
        }]
      }
    }]
  },
  plugins: [
    new WebpackNotifierPlugin(),
    new webpack.DefinePlugin({__CONFIG__: JSON.stringify(config)})
  ]
};
