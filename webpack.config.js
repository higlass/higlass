var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname + '/app',
  entry: {higlass: ['./scripts/higlass.js']},
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
    libraryTarget: 'umd',
    library: '[name]'
  },
  module: {
    loaders: [
      { 
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }, {
        test: /\.css$/,
        loader: 'style!css'
      }
    ],
    postLoaders: [
        {
            include: path.resolve(__dirname, 'node_modules/pixi.js'),
            loader: 'transform?brfs'
        }
    ],
    resolve: {
      extensions: ['.js', '.jsx']
    }
  }
};
