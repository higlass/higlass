import { createServer } from "vite";

/** @returns {import('@web/test-runner').TestRunnerPlugin} */
function vite() {
	/** @type {import('vite').ViteDevServer} */
	let server;
	return {
		name: "vite-plugin",
		async serverStart({ app }) {
			server = await createServer({ clearScreen: false });
			await server.listen();
			const port = server.config.server.port;
			const protocol = server.config.server.https ? "https" : "http";
			app.use(async (ctx, next) => {
				if (ctx.originalUrl.includes("@web/test-runner")) {
					await next();
					return;
				}
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
      // Note: globals expected by @testing-library/react
      window.global = window;
      window.process = { env: {} };
      // Note: adapted from https://github.com/vitejs/vite/issues/1984#issuecomment-778289660
      // Note: without this you'll run into https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="${testRunnerImport}"></script>
  </head>
</html>
`;

/** @type {import('@web/test-runner').TestRunnerConfig} */
export default {
	testRunnerHtml,
	plugins: [vite()],
	files: [
		"test/AxisTests.js", // works
		// 'test/AxisSpecificLocationLockTests.js', // works
		// 'test/2DRectangleDomainsTests.js', // works
		// 'test/AddAndRemoveViewconfTests.js', // works
		// 'test/AddTrackTests.js', // works
		// "test/APITests.js", // works
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
		// 'test/ViewportProjectionTests.js', // works
		// 'test/ZoomTests.js', // works individually
	],
};
