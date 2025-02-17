import { server } from '@vitest/browser/context';
import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { beforeAll } from 'vitest';

/** @type {import('./scripts/vitest-browser-commands.mjs').Commands} */
const commands = /** @type {any} */ (server.commands);

/**
 * @param {string} domain
 */
function higlassHandlerFor(domain) {
  /** @param {{ request: Request }} ctx */
  async function tilesetInfo({ request }) {
    const url = new URL(request.url);
    const ids = url.searchParams.getAll('d');
    await Promise.all(
      ids.map((id) => commands.setCache(domain, 'tileset_info', id, 'foo')),
    );
  }

  return [
    http.get(`http://${domain}/api/v1/tileset_info`, tilesetInfo),
    http.get(`https://${domain}/api/v1/tileset_info`, tilesetInfo),
  ];
}

const worker = setupWorker(
  ...higlassHandlerFor('resgen.io'),
  ...higlassHandlerFor('higlass.io'),
);

beforeAll(async () => {
  await worker.start();
});
