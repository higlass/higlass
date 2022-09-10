import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import * as path from 'node:path';
import * as fs from 'fs';

import { version } from './package.json';

/**
 * Extends Vite with read/write endpoint.
 * Used in ./test/utils/FetchMockHelper.js
 *
 * @example
 * // read contents of "/test/mocked-responses/foo.json"
 * let resp = await fetch("/@mocked-responses/foo.json");
 * let data = await resp.json();
 *
 * @example
 * // writes file to "/test/mocked-responses/foo.json"
 * let resp = await = fetch("/@mocked-responses/foo.json", {
 *   method: "POST",
 *   body: JSON.stringify({ bar: "baz" }),
 * });
 * resp.ok // true;
 *
 * @returns {import('vite').Plugin}
 */
function mockedReponsesPlugin() {
  const realRoute = '/test/mocked-responses/';
  const magicRoute = '/@mocked-responses/';

  return {
    name: 'mocked-responses',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith(magicRoute)) {
          next();
          return;
        }
        if (req.method === 'POST' && req.readable) {
          const file = path.resolve(
            __dirname,
            `.${realRoute}`,
            req.url.slice(magicRoute.length),
          );
          req.pipe(fs.createWriteStream(file));
          req.on('end', () => {
            res.statusCode = 201;
            res.end();
          });
          req.on('error', next);
          return;
        }
        // remove magic and let vite handle...
        req.url = req.url?.replace(magicRoute, realRoute);
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  /** @type {import('vite').UserConfig['build']} */
  const build =
    mode === 'production'
      ? {
          minify: false,
          lib: {
            entry: path.resolve(__dirname, 'app/scripts/hglib.jsx'),
            name: 'hglib',
            formats: ['umd'],
          },
          rollupOptions: {
            external: ['react', 'react-dom', 'pixi.js'],
            output: {
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'pixi.js': 'PIXI',
              },
            },
          },
        }
      : {};
  return {
    resolve: {
      alias: {
        lodash: 'lodash-es',
      },
    },
    build,
    define: {
      global: 'globalThis',
      XYLOPHON: JSON.stringify(version),
    },
    plugins: [
      react({ jsxRuntime: 'classic' }),
      mockedReponsesPlugin(),
    ],
  };
});
