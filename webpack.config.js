/* eslint-env node */
const path = require('path');
const webpack = require('webpack');

const genericNames = require('generic-names');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const CSS_MODULE_LOCAL_IDENT_NAME = '[name]_[local]-[hash:base64:5]';
const generateScopedName = genericNames(CSS_MODULE_LOCAL_IDENT_NAME);

const pkg = require('./package.json');

/** @returns {import('webpack').Configuration} */
module.exports = (_env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  context: path.resolve(__dirname, 'app'),
  devtool: 'inline-source-map',
  devServer: {
    static: path.resolve(__dirname, 'app'),
  },
  entry: {
    hglib: './scripts/hglib.js',
    worker: './scripts/worker.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/',
    libraryTarget: 'umd',
    library: '[name]',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              [
                'react-css-modules',
                {
                  filetypes: { ".scss": { syntax: "postcss-scss" } },
                  generateScopedName,
                }
              ]
            ]
          }
        }
      },
      {
        test: /\.(css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: {
                getLocalIdent({ resourcePath }, _localIdentName, localName) {
                  return generateScopedName(localName, resourcePath);
                },
              },
            }
          },
          "sass-loader",
        ],
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      XYLOPHON: JSON.stringify(pkg.version),
      VERSION: JSON.stringify(pkg.version),
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new MiniCssExtractPlugin,
  ],
  resolve: {
    alias: {
      // Imported by `enzyme`, but package export `./lib/utils` not defined for cheerio.
      'cheerio/lib/utils': path.resolve(__dirname, './node_modules/cheerio/lib/utils.js'),
      // We are stuck on Fritz's fork of d3-brush where this bug persists https://github.com/d3/d3-brush/issues/64
      'd3-dispatch': path.resolve(__dirname, './node_modules/d3-dispatch/dist/d3-dispatch.js'),
    }
  },
  externals: {
    'pixi.js': {
      commonjs: 'pixi.js',
      commonjs2: 'pixi.js',
      amd: 'pixi.js',
      root: 'PIXI',
    },
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
      root: 'React',
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'react-dom',
      root: 'ReactDOM',
    },
  },
});
