// @ts-check
import * as path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

export default defineConfig(({ mode }) => {
  /** @type {import('vite').UserConfig['build']} */
  const build =
    mode === 'production'
      ? {
          minify: false,
          lib: {
            entry: path.resolve(__dirname, 'app/scripts/hglib.jsx'),
            name: 'hglib',
            formats: ['umd', 'es'],
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
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    plugins: [react({ jsxRuntime: 'classic' })],
    optimizeDeps: {
      entries: ['app/scripts/hglib.jsx', 'test/**/*'],
    },
  };
});
