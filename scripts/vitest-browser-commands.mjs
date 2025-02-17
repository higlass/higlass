import * as fs from 'node:fs';
import * as path from 'node:path';

/** @template T @typedef {T extends [any, ...infer R] ? R : never} Tail */

/**
 * @typedef {{
 *   [K in keyof typeof commands]: (...args: Tail<Parameters<commands[K]>>) => ReturnType<commands[K]>
 * }} Commands
 */

/**
 * @param {string} origin
 * @param {string} folder
 * @param {string} id
 */
function resolveCacheItemLocation(origin, folder, id) {
  return path.resolve(import.meta.dirname, './test/mocks', origin, folder, id);
}

/** @satisfies {Record<string, import("vitest/node").BrowserCommand<any>>}*/
export const commands = {
  /**
   * @param {{ }} context
   * @param {string} origin
   * @param {string} route
   * @param {string} id
   */
  // biome-ignore lint/correctness/noEmptyPattern: empty object needed for vitest
  async getCache({}, origin, route, id) {
    const filepath = resolveCacheItemLocation(origin, route, id);
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
   * @param {string} origin
   * @param {string} route
   * @param {string} id
   * @param {string} contents
   */
  // biome-ignore lint/correctness/noEmptyPattern: empty object needed for vitest
  async setCache({}, origin, route, id, contents) {
    const filepath = resolveCacheItemLocation(origin, route, id);
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(filepath, contents);
  },
};
