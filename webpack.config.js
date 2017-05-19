var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  context: __dirname + '/app',
  entry: {
      hglib: ['./scripts/hglib.jsx'],
      worker: ['./scripts/worker.js']
  },
  devtool: "cheap-source-map",
  output: {
    path: __dirname + '/build',
    publicPath: '/',
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
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['es2015', { modules: false }],
                'react'
              ]
            }
          }
        ]
      }
      , 
      {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
              fallback: "style-loader",
              use: "css-loader"
          })
      }

    ],
    noParse: [
        /node_modules\/sinon\//,
    ]
  },
  externals: {
      "pixi.js": 'PIXI',
      react: 'React',
      "react-dom": 'ReactDOM',
      "react-bootstrap": "ReactBootstrap"
  },
  plugins: [
    new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify('production')
          }
    }),
    new webpack.IgnorePlugin(/react\/addons/),
    new webpack.IgnorePlugin(/react\/lib\/ReactContext/),
    new webpack.IgnorePlugin(/react\/lib\/ExecutionEnvironment/),
    new ExtractTextPlugin("styles.css")
    /*
    ,
    new BundleAnalyzerPlugin({
        analyzerMode: 'static'
    })
    */
  ]
};

