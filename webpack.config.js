var path = require('path');
var webpack = require('webpack');

module.exports = {
    debug: true,
  context: __dirname + '/app',
  entry: {
      playground: ['./scripts/playground.jsx'],
      main: ['./scripts/main.jsx'],
      worker: ['./scripts/worker.js']
  },
  output: {
    path: __dirname + '/build',
    publicPath: '/scripts/',
    filename: '[name].js',
    libraryTarget: 'umd',
    library: '[name]'
  },
  module: {
    loaders: [
      { 
        test: /\.jsx?$/,
        //exclude: /node_modules/,
        include: [path.resolve(__dirname, 'app/scripts')],
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
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
    externals: {

               },
    resolve: {
      extensions: ['.js', '.jsx']
    }
  }
};
