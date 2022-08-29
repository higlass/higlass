import { createServer } from 'vite';

/**
 * A plugin to power web-dev-server with Vite.
 *
 * @param {RegExp=} ignore a regex to match any routes that should be ignored by our plugin.
 * @returns {import('@web/test-runner').TestRunnerPlugin}
 */
function vite(ignore) {
  /** @type {import('vite').ViteDevServer} */
  let server;
  return {
    name: 'vite-plugin',
    async serverStart({ app }) {
      server = await createServer({ clearScreen: false });
      await server.listen();
      const port = server.config.server.port;
      const protocol = server.config.server.https ? 'https' : 'http';
      app.use(async (ctx, next) => {
        if (ignore?.test(ctx.originalUrl)) {
          await next();
          return;
        }
        // pass off request to vite
        ctx.redirect(`${protocol}://localhost:${port}${ctx.originalUrl}`);
      });
    },
    serverStop() {
      return server.close();
    },
  };
}

/**
 * @type {import('@web/test-runner').TestRunnerConfig['testRunnerHtml']}
 *
 * Note: adapted from https://github.com/vitejs/vite/issues/1984#issuecomment-778289660
 * without this you'll run into https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201
 */
const testRunnerHtml = (testRunnerImport) =>
  `\
<html>
  <head>
    <script type="module">
      // Note: adapted from https://github.com/vitejs/vite/issues/1984#issuecomment-778289660
      // Note: without this you'll run into https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201
      window.global = window;
      window.process = { env: {} };
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="${testRunnerImport}"></script>
  </head>
</html>
`;

/** @type {import('@web/test-runner').TestRunnerConfig} */
export default {
  plugins: [vite()],
  // html loaded for each file (loads test runner + vite globals)
  testRunnerHtml,
  // how long a test file can take to finish.
  testsFinishTimeout: 1000 * 60 * 6, // (6 min)
  // mocha config https://mochajs.org/api/mocha
  testFramework: { config: { timeout: 100000 } },
  // hide some console logging
  filterBrowserLogs: ({ type }) => !['warn', 'debug', 'log'].includes(type),
  files: [
    'test/AxisTests.js',
    'test/AxisSpecificLocationLockTests.js',
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
    'test/GenomePositionSearchBoxTest.jsx',
    'test/HeatmapTests.js',
    'test/HiGlassComponentCreationTests.js',
    'test/HiGlassComponent/*.{js,jsx}',
    'test/Horizontal1DTrackTests.js',
    'test/HorizontalHeatmapTests.js',
    // The tests in HorizontalMultivecTests are overwriting
    // the default [div,hgc] created in beforeAll. This needs
    // to be fixed before they can be enabled
    // 'test/HorizontalMultivecTests.js', //fails
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
    'test/PluginDataFetcherTests.js', // fails
    'test/PluginTrackTests.js', // fails
    'test/PngExportTest.js',
    'test/RuleTests.js',
    'test/search_field_test.js',
    'test/SVGExportTest.js',
    'test/tile-proxy.js',
    'test/TiledPixiTrackTests.js',
    'test/TrackLabelsTest.js',
    'test/UtilsTests.js',
    'test/ViewConfigEditorTests.js',
    'test/ViewManipulationTests.js', // skipped
    'test/ViewportProjectionTests.js',
    'test/ZoomTests.js',
  ],
};
