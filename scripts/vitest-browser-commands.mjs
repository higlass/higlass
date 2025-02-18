/**
 * @module vitest-browser-commands
 *
 * Server-side commands for tests running in the browser.
 * Exposes file system access for our mocking helpers.
 *
 * @see vitest.setup.js for usage.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

/** @template T @typedef {T extends [any, ...infer R] ? R : never} Tail */

/**
 * @typedef {{
 *   [K in keyof typeof commands]: (...args: Tail<Parameters<typeof commands[K]>>) => ReturnType<typeof commands[K]>
 * }} ServerCache
 */

/** Where to save the mocks. In CI we set this to `higlass-test-mocks` repo. */
const mockDataDir = process.env.HIGLASS_MOCKS_DIR
  ? path.resolve(process.env.HIGLASS_MOCKS_DIR)
  : path.resolve(import.meta.dirname, './test/mocks');

/** In-memory (to avoid repeated fs operations) */
const local = new Map();

// biome-ignore lint/suspicious/noConsole: Logging during tests
console.log(`[higlass] Using mock data directory: ${mockDataDir}`);

/** @satisfies {Record<string, import("vitest/node").BrowserCommand<any>>}*/
export const commands = {
  /**
   * @param {{ }} context
   * @param {ReadonlyArray<string>} pathArgs
   */
  // biome-ignore lint/correctness/noEmptyPattern: empty object needed for vitest
  async get({}, pathArgs) {
    const key = pathArgs.join('::');
    const filepath = path.resolve(mockDataDir, ...pathArgs);
    if (local.has(key)) {
      return local.get(key);
    }
    return fs.promises
      .readFile(filepath, { encoding: 'utf-8' })
      .then((text) => {
        local.set(key, text);
        return text;
      })
      .catch((err) => {
        if (err.code === 'ENOENT') {
          // biome-ignore lint/suspicious/noConsole: Logging during tests
          console.log(`[higlass] Cache miss ${pathArgs.join('/')}`);
          // file not found
          return undefined;
        }
        throw err;
      });
  },
  /**
   * @param {{ }} context
   * @param {ReadonlyArray<string>} pathArgs
   * @param {string} contents
   */
  // biome-ignore lint/correctness/noEmptyPattern: empty object needed for vitest
  async set({}, pathArgs, contents) {
    const key = pathArgs.join('::');
    const filepath = path.resolve(mockDataDir, ...pathArgs);
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(filepath, contents);
    local.set(key, contents);
  },
};
