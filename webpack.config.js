/* eslint-env node */

const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  context: `${__dirname}/app`,
  entry: {
    hglib: './scripts/hglib.js',
    worker: './scripts/worker.js',
  },
  watch: !!argv.watch,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
    ignored: /node_modules/,
  },
  // devtool: 'cheap-source-map',
  devServer: {
    contentBase: [
      path.resolve(__dirname, 'app'),
      path.resolve(__dirname, 'docs', 'examples'),
      path.resolve(__dirname, 'node_modules'),
    ],
    publicPath: '/'
  },
  output: {
    path: `${__dirname}/build`,
    publicPath: '/',
    // UnminifiedWebpackPlugin requires the `.min` extension but
    // in development mode the unminified version is ignored anyway. This means
    // the default build is unminified *but* would have the `.min` extension,
    // which would cause webpack-dev-server to fail because `hglib.js` is
    // missing. Hence we need to change the template based on the mode.
    filename: argv.mode === 'production' ? '[name].min.js' : '[name].js',
    libraryTarget: 'umd',
    library: '[name]',
  },
  optimization: {
    minimize: argv.mode === 'production',
    minimizer: [
      new UglifyJsPlugin({
        include: /\.min\.js$/,
      }),
      new OptimizeCSSAssetsPlugin()
    ]
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'app/scripts'),
          path.resolve(__dirname, 'test'),
        ],
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: [
                [
                  'react-css-modules',
                  {
                    context: path.resolve(__dirname, 'app'),
                    filetypes: {
                      '.scss': {
                        syntax: 'postcss-scss',
                      },
                    },
                    generateScopedName: '[name]_[local]-[hash:base64:5]',
                  },
                ],
              ],
            },
          },
        ],
      },
      {
        test: /^((?!\.module).)*s?css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'fast-css-loader',
            options: {
              importLoaders: 2,
              minimize: false,
              sourceMap: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              // Necessary for external CSS imports to work
              // https://github.com/facebookincubator/create-react-app/issues/2677
              ident: 'postcss',
              plugins: () => [
                require('postcss-flexbugs-fixes'),
                autoprefixer({
                  browsers: [
                    '>1%',
                    'last 4 versions',
                    'Firefox ESR',
                    'not ie < 9', // React doesn't support IE8 anyway
                  ],
                  flexbox: 'no-2009',
                }),
              ],
              sourceMap: false,
            },
          },
          {
            loader: 'fast-sass-loader',
            options: {
              sourceMap: false,
            },
          },
        ],
      },
      {
        test: /\.module.s?css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              localIdentName: '[name]_[local]-[hash:base64:5]',
              minimize: false,
              modules: true,
              sourceMap: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              // Necessary for external CSS imports to work
              // https://github.com/facebookincubator/create-react-app/issues/2677
              ident: 'postcss',
              plugins: () => [
                require('postcss-flexbugs-fixes'),
                autoprefixer({
                  browsers: [
                    '>1%',
                    'last 4 versions',
                    'Firefox ESR',
                    'not ie < 9', // React doesn't support IE8 anyway
                  ],
                  flexbox: 'no-2009',
                }),
              ],
              sourceMap: false,
            },
          },
          {
            loader: 'fast-sass-loader',
            options: {
              sourceMap: false,
            },
          },
        ],
      },
    ],
    noParse: [
      /node_modules\/sinon\//,
    ],
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
    'react-bootstrap': {
      commonjs: 'react-bootstrap',
      commonjs2: 'react-bootstrap',
      amd: 'react-bootstrap',
      root: 'ReactBootstrap',
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.IgnorePlugin(/react\/addons/),
    new webpack.IgnorePlugin(/react\/lib\/ReactContext/),
    new webpack.IgnorePlugin(/react\/lib\/ExecutionEnvironment/),
    new MiniCssExtractPlugin('hglib.css'),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new UnminifiedWebpackPlugin(),
    // new BundleAnalyzerPlugin(),
  ],
});
