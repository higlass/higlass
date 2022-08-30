import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import * as path from 'node:path';
import { version } from './package.json';

const generateScopedName = `[name]_[local]_hg-${version}`;

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
        slugid: path.resolve(__dirname, './app/bufferless-slugid.js'),
        lodash: 'lodash-es',
      },
    },
    build,
    define: {
      global: 'globalThis',
      XYLOPHON: JSON.stringify(version),
    },
    css: {
      modules: { generateScopedName },
    },
    plugins: [
      react({
        jsxRuntime: 'classic',
        babel: { plugins: [reactCssModules] },
      }),
    ],
  };
});
