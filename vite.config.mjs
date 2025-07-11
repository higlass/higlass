import * as path from 'node:path';
import react from '@vitejs/plugin-react';
import { version } from './package.json';
import { commands } from './scripts/vitest-browser-commands.mjs';

/** @type {import("vite").UserConfigFnObject} */
export default ({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      lodash: 'lodash-es',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  define: {
    global: 'globalThis',
    XYLOPHON: JSON.stringify(version),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  optimizeDeps: {
    entries: ['app/scripts/hglib.jsx', 'test/**/*'],
  },
  test: {
    silent: true,
    setupFiles: path.resolve(__dirname, './vitest.setup.js'),
    browser: {
      provider: 'playwright',
      headless: true,
      enabled: true,
      instances: [{ browser: 'chromium' }],
      // Custom server-side commands exposed to the front end http://vitest.dev/guide/browser/commands#custom-commands
      commands: commands,
    },
  },
});
