// @ts-nocheck
import ReactDOM from 'react-dom';

/**
 * Compatibility layer for ReactDOM.render / createRoot APIs.
 *
 * - React 18+: uses `createRoot` from `react-dom/client`
 * - React 16/17: falls back to legacy `ReactDOM.render`
 *
 * This allows HiGlass to support React 16–19 as peer dependencies.
 */

/** @type {WeakMap<HTMLElement, { unmount: () => void }>} */
const containerRoots = new WeakMap();

/** @type {((container: HTMLElement) => import('react-dom/client').Root) | null} */
let _createRoot = null;

/** @type {boolean} */
let _resolved = false;

// Check synchronously first (UMD builds expose createRoot on ReactDOM)
if (typeof ReactDOM.createRoot === 'function') {
  _createRoot = ReactDOM.createRoot;
  _resolved = true;
}

// Attempt dynamic import for ESM builds (react-dom/client is a separate entry point).
// The module specifier is built via concatenation so that bundlers (Vite, Rollup)
// do not try to statically resolve it — it may not exist in React 16/17.
/** @type {string} */
const _clientModuleId = 'react-dom' + '/client';
/** @type {Promise<void>} */
const _clientPromise = _resolved
  ? Promise.resolve()
  : import(/* @vite-ignore */ _clientModuleId)
      .then((mod) => {
        if (typeof mod.createRoot === 'function') {
          _createRoot = mod.createRoot;
        }
      })
      .catch(() => {
        // React 16/17: react-dom/client doesn't exist, use legacy API
      })
      .finally(() => {
        _resolved = true;
      });

/**
 * Wait for the createRoot detection to complete.
 * Call this before the first `renderToContainer` in async contexts.
 * @returns {Promise<void>}
 */
export async function ensureReady() {
  if (!_resolved) await _clientPromise;
}

/**
 * Render a React element into a container, using `createRoot` if available.
 *
 * @param {HTMLElement} container
 * @param {React.ReactNode} element
 * @returns {{ unmount: () => void }}
 */
export function renderToContainer(container, element) {
  if (_createRoot) {
    const root = _createRoot(container);
    root.render(element);
    const handle = { unmount: () => root.unmount() };
    containerRoots.set(container, handle);
    return handle;
  }
  // Legacy fallback (React 16/17)
  ReactDOM.render(element, container);
  const handle = {
    unmount: () => ReactDOM.unmountComponentAtNode(container),
  };
  containerRoots.set(container, handle);
  return handle;
}

/**
 * Unmount a React tree from a container.
 *
 * Looks up the handle from `renderToContainer`, or falls back to the legacy
 * `ReactDOM.unmountComponentAtNode` (for trees mounted outside the compat layer,
 * e.g. by Enzyme in tests).
 *
 * @param {HTMLElement} container
 * @returns {void}
 */
export function unmountFromContainer(container) {
  const handle = containerRoots.get(container);
  if (handle) {
    handle.unmount();
    containerRoots.delete(container);
  } else if (typeof ReactDOM.unmountComponentAtNode === 'function') {
    ReactDOM.unmountComponentAtNode(container);
  }
}
