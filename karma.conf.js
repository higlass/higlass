const webpackConfig = require('./webpack.config.js');
require('@babel/polyfill'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = (config) => {
  config.set({
    /** * maximum number of tries a browser will attempt in the case
     * of a disconnection */
    browserDisconnectTolerance: 2,
    captureTimeout: 10000,
    pingTimeout: 10000,
    /** * How long will Karma wait for a message from a browser before
     * disconnecting from it (in ms). */
    browserNoActivityTimeout: 90000,
    basePath: '',
    frameworks: ['jasmine', 'server-side'],
    client: {
      jasmine: {
        random: false,
      },
    },
    files: [
      'node_modules/@babel/polyfill/dist/polyfill.js',
      'node_modules/react/umd/react.development.js',
      'node_modules/react-dom/umd/react-dom.development.js',
      'node_modules/pixi.js/dist/pixi.js',
      'node_modules/react-bootstrap/dist/react-bootstrap.js',
      'node_modules/bootstrap/dist/css/bootstrap.min.css',
      'node_modules/font-awesome/css/font-awesome.css',
      'build/hglib.css',
      'build/hglib.js',
      {
        pattern: 'docs/examples/viewconfs/*.json',
        watched: true,
        served: true,
        included: false,
      },
      // 'test/AxisTests.js', // works
      // 'test/AxisSpecificLocationLockTests.js', // works
      // 'test/2DRectangleDomainsTests.js', // works
      // 'test/AddAndRemoveViewconfTests.js', // works
      // 'test/AddTrackTests.js', // works
      // 'test/APITests.js', // works
      // 'test/BarTrackTests.js', // works
      // 'test/BedLikeTests.js', // works
      // 'test/ChromosomeLabelsTests.js', // works
      // 'test/ChromSizesTests.js', // works
      // 'test/DenseDataExtremaTests.js', // works
      // 'test/EmptyTrackTests.js', // works
      // 'test/GenbankFetcherTests.js', // works
      // 'test/GeneAnnotationsTrackTests.js', // works
      // 'test/GenomePositionSearchBoxTest.js', // works
      // 'test/HeatmapTests.js', // works
      // 'test/HiGlassComponentCreationTests.js', // works
      // // // 'test/HiGlassComponent/*.js',
      // 'test/Horizontal1DTrackTests.js', // works
      // 'test/HorizontalHeatmapTests.js', // works
      // // The tests in HorizontalMultivecTests are overwriting
      // // the default [div,hgc] created in beforeAll. This needs
      // // to be fixed before they can be enabled
      // // 'test/HorizontalMultivecTests.js', //fails
      // 'test/LabelTests.js', // works
      // 'test/LeftTrackModifierTests.js', // works
      // 'test/LocalTileFetcherTests.js', // works
      // 'test/LockTests.js', // works
      // 'test/MinimalViewconfTest.js', // works
      // 'test/ndarray-assign.spec.js', // works individually
      // 'test/ndarray-flatten.spec.js', // works individually
      // 'test/ndarray-to-list.spec.js', // works individually
      // 'test/OSMTests.js', // works individually
      // 'test/OverlayTrackTests.js', //works individually
      // 'test/PluginDataFetcherTests.js', // works
      // 'test/PluginTrackTests.js', // works individually
      // 'test/PngExportTest.js', // works
      // 'test/RuleTests.js', // works individually
      // 'test/search_field_test.js', // works individually
      // 'test/SVGExportTest.js', // works
      // 'test/tile-proxy.js', // works
      // 'test/TiledPixiTrackTests.js', //works individually
      // 'test/TrackLabelsTest.js', //works individually
      // 'test/UtilsTests.js', // works individually
      // 'test/ViewConfigEditorTests.js', // works
      // 'test/ViewManipulationTests.js', // skipped
      'test/ViewportProjectionTests.js', //fails
      // 'test/ZoomTests.js', // works individually
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
    browsers: ['Chrome'],
    singleRun: false,
    customLaunchers: {
      // Chrome_travis_ci: {
      //   base: 'Chrome',
      //   flags: ['--no-sandbox'],
      // },
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
