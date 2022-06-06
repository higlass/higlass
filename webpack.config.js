/* eslint-env node */
const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

/** @returns {import('webpack').Configuration} */
module.exports = (_env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  context: path.resolve(__dirname, 'app'),
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
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.(css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
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
    new MiniCssExtractPlugin
  ],
  resolve: {
    fallback: {
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
