/**
 * Vite plugin that inlines compiled CSS into JS via a virtual module.
 *
 * Consumers can import the CSS string:
 *
 *   import stylesheet from 'virtual:stylesheet';
 *
 * - In dev mode the module resolves to `export default ""` (Vite handles CSS via HMR).
 * - In build mode a placeholder is emitted, then in `generateBundle` the placeholder
 *   is replaced with the actual CSS string (JSON-escaped) and the CSS asset is removed
 *   from the bundle so no separate `.css` file is emitted.
 *
 * Adapted from Marimo's virtual-stylesheet pattern.
 */

const VIRTUAL_ID = 'virtual:stylesheet';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const PLACEHOLDER = '__VIRTUAL_STYLESHEET_PLACEHOLDER__';

/** @returns {import("vite").Plugin} */
export default function virtualStylesheetPlugin() {
  let isBuild = false;

  return {
    name: 'virtual-stylesheet',
    enforce: 'post',

    config(_config, { command }) {
      isBuild = command === 'build';
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;
      if (!isBuild) {
        // Dev mode — Vite handles CSS natively via HMR
        return 'export default "";';
      }
      // Build mode — emit a placeholder that will be replaced in generateBundle
      return `export default "${PLACEHOLDER}";`;
    },

    generateBundle(_options, bundle) {
      if (!isBuild) return;

      // Find the CSS asset
      let cssContent = '';
      let cssFileName = '';
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type === 'asset' && fileName.endsWith('.css')) {
          cssContent = /** @type {string} */ (asset.source);
          cssFileName = fileName;
          break;
        }
      }

      if (!cssContent) return;

      // Escape the CSS for embedding as a JS string literal
      const escapedCss = JSON.stringify(cssContent).slice(1, -1);

      // Replace the placeholder in all JS chunks
      for (const asset of Object.values(bundle)) {
        if (asset.type === 'chunk') {
          asset.code = asset.code.replaceAll(PLACEHOLDER, escapedCss);
        }
      }

      // Remove the CSS asset from the bundle output
      delete bundle[cssFileName];
    },
  };
}
