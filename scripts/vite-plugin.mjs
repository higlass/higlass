import { createServer } from 'vite';

/**
 * A plugin to power web-dev-server with Vite.
 *
 * @param {object} opts
 * @param {RegExp=} opts.ignore a regex to match any routes that should be ignored by our plugin.
 * @returns {import('@web/test-runner').TestRunnerPlugin}
 */
export default function({ ignore } = {}) {
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
