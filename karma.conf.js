const webpackConfig = require('./webpack.config.js');
require('babel-polyfill'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = (config) => {
  config.set({
    /** * maximum number of tries a browser will attempt in the case
     * of a disconnection */
    browserDisconnectTolerance: 2,
    /** * How long will Karma wait for a message from a browser before
     * disconnecting from it (in ms). */
    browserNoActivityTimeout: 90000,
    basePath: '',
    frameworks: ['jasmine', 'server-side'],

    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'node_modules/react/umd/react.development.js',
      'node_modules/react-dom/umd/react-dom.development.js',
      'node_modules/pixi.js/dist/pixi.js',
      'node_modules/react-bootstrap/dist/react-bootstrap.js',
      'node_modules/bootstrap/dist/css/bootstrap.min.css',
      'node_modules/font-awesome/css/font-awesome.css',
      'build/hglib.css',
      {
        pattern: 'docs/examples/viewconfs/*.json',
        watched: true,
        served: true,
        included: false,
      },
      'test/AxisTests.js',
      'test/2DRectangleDomainsTests.js',
      'test/AddAndRemoveViewconfTests.js',
      'test/AddTrackTests.js',
      'test/APITests.js',
      'test/BarTrackTests.js',
      'test/BedLikeTests.js',
      'test/ChromosomeLabelsTests.js',
      'test/ChromSizesTests.js',
      'test/DenseDataExtremaTests.js',
      'test/EmptyTrackTests.js',
      'test/GenbankFetcherTests.js',
      'test/GeneAnnotationsTrackTests.js',
      'test/GenomePositionSearchBoxTest.js',
      'test/HeatmapTests.js',
      'test/HiGlassComponentCreationTests.js',
      'test/HiGlassComponentTest.js',
      'test/Horizontal1DTrackTests.js',
      'test/HorizontalHeatmapTests.js',
      'test/HorizontalMultivecTests.js',
      'test/LabelTests.js',
      'test/LeftTrackModifierTests.js',
      'test/LocalTileFetcherTests.js',
      'test/LockTests.js',
      'test/MinimalViewconfTest.js',
      'test/ndarray-assign.spec.js',
      'test/ndarray-flatten.spec.js',
      'test/ndarray-to-list.spec.js',
      'test/OSMTests.js',
      'test/OverlayTrackTests.js',
      'test/PluginDataFetcherTests.js',
      'test/PluginTrackTests.js',
      'test/PngExportTest.js',
      'test/RuleTests.js',
      'test/SchemaTests.js',
      'test/search_field_test.js',
      'test/SVGExportTest.js',
      'test/tile-proxy.js',
      'test/TiledPixiTrackTests.js',
      'test/TrackLabelsTest.js',
      'test/UtilsTests.js',
      'test/ViewConfigEditorTests.js',
      'test/ViewManipulationTests.js',
      'test/ViewportProjectionTests.js',
      'test/ZoomTests.js',
    ],

    preprocessors: {
      // add webpack as preprocessor
      'app/scripts/**/*.+(js|jsx)': ['webpack', 'sourcemap'],
      'test/**/*.+(js|jsx)': ['webpack', 'sourcemap'],
    },

    // webpackConfig(env, argv)
    webpack: webpackConfig({}, {}),

    webpackServer: {
      noInfo: true, // please don't spam the console when running in karma!
    },

    plugins: [
      'karma-webpack',
      'karma-jasmine',
      'karma-server-side',
      'karma-sourcemap-loader',
      'karma-chrome-launcher',
      'karma-phantomjs2-launcher',
      'karma-verbose-reporter',
    ],

    babelPreprocessor: {
      options: {
        presets: ['airbnb'],
      },
    },
    reporters: ['verbose'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_DEBUG,
    autoWatch: true,
    browsers: ['Chrome', 'HeadlessChrome'],
    singleRun: false,
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox'],
      },
      HeadlessChrome: {
        base: 'ChromeHeadless',
        flags: [
          '--disable-translate',
          '--disable-extensions',
          '--remote-debugging-port=9223',
        ],
      },
    },
  });

  if (process.env.TRAVIS) {
    config.browsers = ['Chrome_travis_ci'];
  }
};
