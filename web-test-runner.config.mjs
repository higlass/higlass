import { puppeteerLauncher } from "@web/test-runner-puppeteer";
import { createServer } from "vite";
import { jasmineTestRunnerConfig } from "web-test-runner-jasmine";

const preamble = `\
<script type="module">
  // Note: adapted from https://github.com/vitejs/vite/issues/1984#issuecomment-778289660
  // Note: without this you'll run into https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201
  window.__vite_plugin_react_preamble_installed__ = true;
</script>
`;

/** @returns {import('@web/test-runner').TestRunnerPlugin} */
function vite() {
	/** @type {import('vite').ViteDevServer} */
	let server;

	return {
		name: "vite-plugin",
		async serverStart({ app }) {
			server = await createServer({ clearScreen: false });
			await server.listen();
			const { port, https } = server.config.server;
			app.use(async (ctx, next) => {
				const url = ctx.originalUrl;
				/** Checks whether the url is a virtual file served by @web/test-runner. */
				if (
					url.includes("@web/test-runner") ||
					url.startsWith("/__web-dev-server") ||
					url.startsWith("/__web-test-runner")
				) {
					await next();
					return;
				}
				ctx.redirect(`${https ? "https" : "http"}://localhost:${port}${url}`);
			});
		},
		serverStop() {
			return server.close();
		},
	};
}

const jasmine = jasmineTestRunnerConfig();

/** @type {import('@web/test-runner').TestRunnerConfig} */
export default {
	...jasmine,
	// we need to inject some additional HTML into the jasmine template for vite
	testRunnerHtml: (...args) =>
		jasmine.testRunnerHtml(...args)
			.replace("<head>", `<head>${preamble}`)
			.replace("@web/test-runner-core", "./node_modules/@web/test-runner-core"),
	testFramework: {
		config: {
			// timeout: 10000,
			timeout: 100000,
		},
	},
	files: [
		"./test/APITests.js",
		// "./test.js"
	],
	plugins: [
		vite(),
	],
	browsers: [
		puppeteerLauncher({
			launchOptions: {
				headless: false,
				devtools: true,
			},
		}),
	],
};
