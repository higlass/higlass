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

/** @satisfies {Record<string, import("vitest/node").BrowserCommand<any>>}*/
export const commands = {
  /**
   * @param {{ }} context
   * @param {ReadonlyArray<string>} pathArgs
   */
  // biome-ignore lint/correctness/noEmptyPattern: empty object needed for vitest
  async get({}, pathArgs) {
    const filepath = path.resolve(
      import.meta.dirname,
      './test/mocks',
      ...pathArgs,
    );
    return fs.promises
      .readFile(filepath, { encoding: 'utf-8' })
      .catch((err) => {
        if (err.code === 'ENOENT') {
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
    const filepath = path.resolve(
      import.meta.dirname,
      './test/mocks',
      ...pathArgs,
    );
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(filepath, contents);
  },
};
