import { createServer } from 'vite';

/**
 * A plugin to power web-dev-server with Vite.
 *
 * @param {object} opts
 * @param {RegExp=} opts.ignore a regex to match any routes that should be ignored by our plugin.
 * @returns {import('@web/test-runner').TestRunnerPlugin}
 */
function vitePlugin({ ignore } = {}) {
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
 * Client JS code to be injected into the HTML via a script tag.
 *
 * Sets some globals so that rect plugin for Vite is happy in web-test-runner
 *
 * @see https://github.com/vitejs/vite/issues/1984#issuecomment-778289660
 * @see https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201
 *
 */
vitePlugin.clientJs = `\
  window.global = window;
  window.process = { env: {} };
  window.__vite_plugin_react_preamble_installed__ = true;
`;

export default vitePlugin;
