const path = require('path');
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
  entry: path.join(__dirname, './src/js/index.js'),
  devtool: 'eval',
  output: {
    path: path.join(__dirname, './www/js'),
    filename: 'index.bundle.js'
  },
  plugins: [
    new WebpackNotifierPlugin()
  ]
};
