import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      lodash: 'lodash-es',
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
}));
