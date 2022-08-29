import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import genericNames from 'generic-names';

import * as path from 'node:path';
import * as fs from 'fs';

import { version } from './package.json';

// Necessary have consistent hashing for `react-css-modules` and `css` modules
// https://github.com/gajus/babel-plugin-react-css-modules/issues/291
const generateScopedName = genericNames('[name]__[local]_[hash:base64:5]', {
  context: path.resolve(__dirname, 'app'),
});

// Babel plugin which enables use of `styleNames` in JSX
const reactCssModules = [
  'react-css-modules',
  {
    generateScopedName,
    filetypes: {
      '.scss': { syntax: 'postcss-scss' },
    },
  },
];

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
};

export default defineConfig({
  resolve: {
    alias: {
      'enzyme-adapter-react-16': '@wojtekmaj/enzyme-adapter-react-17',
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'app/scripts/hglib.jsx'),
      name: 'hglib',
      formats: ['umd'],
    },
    rollupOptions: {
      external: ["react", "react-dom", "pixi.js"],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'pixi.js': 'PIXI',
        },
      },
    },
    minify: false,
  },
  define: {
    global: 'globalThis',
    XYLOPHON: JSON.stringify(version),
  },
  css: {
    modules: { generateScopedName },
  },
  plugins: [
    react({ babel: { plugins: [reactCssModules] } }),
    mockedReponsesPlugin(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      inject: [path.resolve(__dirname, './app/buffer-shim.js')],
    },
  },
});
