var path = require('path');
var webpack = require('webpack');

module.exports = {
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
      }, {
        test: /\.css$/,
      use: [
         {
           loader: "style-loader"
         },
         {
           loader: "css-loader",
           options: {
             modules: true
           }
         }
      ]
      }

    ],
    noParse: [
        /node_modules\/sinon\//,
    ]
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

