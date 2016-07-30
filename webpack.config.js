var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname + '/app',
  entry: {
      main: ['./scripts/main.jsx'],
      worker: ['./scripts/worker.js']},
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
    libraryTarget: 'umd',
    library: '[name]'
  },
  module: {
    loaders: [
      { 
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        }
      }, {
        test: /\.css$/,
        loader: 'style!css'
      }
    ],
    externals: {
        'd3': 'd3'
               },
    resolve: {
      extensions: ['.js', '.jsx']
    }
  }
};
