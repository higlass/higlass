/* eslint-env node */

const webpack = require('webpack');

const packageJson = require('../package.json');

module.exports = function () {
  return new webpack.DefinePlugin({
    XYLOPHON: JSON.stringify(packageJson.version),
  });
};
