var path = require('path');
var webpack = require('webpack');

module.exports = {
    debug: true,
  context: __dirname + '/app',
  entry: {
      playground: ['./scripts/playground.jsx'],
      hglib: ['./scripts/hglib.jsx'],
      worker: ['./scripts/worker.js']
  },
  devtool: "cheap-source-map",
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
        include: [path.resolve(__dirname, 'app/scripts'), path.resolve(__dirname, 'test')],
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        }
      }, {
        test: /\.css$/,
        loader: 'style!css'
      }
    ],
    preLoaders: [
        { test: /\.json$/, loader: 'json'},
    ],
    postLoaders: [
        {
            include: path.resolve(__dirname, 'node_modules/pixi.js'),
            loader: 'transform?brfs'
        }
    ],
    noParse: [
        /node_modules\/sinon\//,
    ],
    externals: {
        'react/addons': true
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            'sinon': 'sinon/pkg/sinon'
        }
    }
  },
  plugins: [
    new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify('production')
          }
    }),
    new webpack.IgnorePlugin(/react\/addons/),
    new webpack.IgnorePlugin(/react\/lib\/ReactContext/),
    new webpack.IgnorePlugin(/react\/lib\/ExecutionEnvironment/)
  ]
};

