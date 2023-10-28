import vite from './scripts/wtr-vite-plugin.mjs';
import cache from './scripts/wtr-cache-plugin.mjs';

const USE_CACHE = process.env.HIGLASS_USE_CACHE === 'true';
const cacheFile = './response-cache.json';
if (USE_CACHE) {
  // eslint-disable-next-line no-console
  console.log(`Using cache file: ${cacheFile}.`);
} else {
  // eslint-disable-next-line no-console
  console.log('Not using cache.');
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
      ${vite.clientJs}
      ${USE_CACHE ? cache.clientJs : ''}
    </script>
    <script type="module" src="${testRunnerImport}"></script>
  </head>
</html>
`;

/** @type {import('@web/test-runner').TestRunnerConfig} */
export default {
  // Required because tests require awaiting global variables
  concurrency: 1,
  plugins: [
    ...(USE_CACHE ? [cache({ persist: cacheFile })] : []),
    vite({ ignore: /^\/@cache/ }),
  ],
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
