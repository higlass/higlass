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
        /*
        'react': 'React',
        'react-dom': 'ReactDOM'
        */
    },
    resolve: {
      extensions: ['.js', '.jsx']
    }
  },
  plugins: [
    new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify('production')
          }
    })
  ]
};

