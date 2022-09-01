import * as fsp from 'node:fs/promises';
import * as consumers from 'node:stream/consumers';

/**
 * @param {object} opts
 * @param {string} opts.persist where to read and write cache to.
 * @returns {import('@web/test-runner').TestRunnerPlugin}
 */
function cachePlugin({ persist }) {
  /** @type {Map<string, string>} */
  let cache = new Map;

  return {
    name: 'cache-plugin',
    async serverStart({ app }) {

      if (persist) {
        const obj = await fsp
          .readFile(persist, { encoding: 'utf-8' })
          .then(JSON.parse)
          .catch(() => ({}));
        cache = new Map(Object.entries(obj))
      }

      app.use(async (ctx, next) => {
        const method = ctx.req.method?.toUpperCase() ?? "GET";
        if (!/^\/@cache/.test(ctx.url)) {
          await next();
          return;
        }
        const search = ctx.url.split("?")[1];
        const href = new URLSearchParams(search).get("href");
        if (method === "POST" && ctx.req.readable) {
          cache.set(href, await consumers.text(ctx.req));
          ctx.res.statusCode = 201;
        } else {
          const data = cache.get(href);
          if (data) {
            ctx.res.statusCode = 200;
            ctx.res.write(data);
          } else {
            ctx.res.statusCode = 204;
          }
        }
        ctx.res.end();
      });
    },
    async serverStop() {
      if (!persist) return;
      const data = Object.fromEntries(cache.entries());
      await fsp.writeFile(persist, JSON.stringify(data));
    },
  };
}

/**
 * Client JS code to be injected into the HTML via a script tag.
 *
 * Inspects `fetch` requests, and checks magic `/@cache` route for a given URL. 
 * If missing, requests original URL and then POSTs a copy of the `Response` to `/@cache`.
 */
cachePlugin.clientJs = `\
const originalFetch = window.fetch;

/** @type {fetch} */
window.fetch = async (input, init) => {
  if (typeof input === 'string' || input instanceof URL) {
    const href = typeof input === 'string' ? input : input.href;
    const { method = 'GET' } = init ?? {};
    if (
      /\\/\\/(higlass|resgen).io/.test(href) &&
      method.toUpperCase() === 'GET'
    ) {
      const magicUrl = \`/@cache?href=\${encodeURIComponent(href)}\`;
      let response = await originalFetch(magicUrl);
      if (response.status === 200) {
        return response;
      }
      response = await originalFetch(input, init);
      // POST a copy of the data to our server
      await originalFetch(magicUrl, {
        method: 'POST',
        body: await response.clone().text(),
      });
      // return the original data,
      return response;
    }
  }
  return originalFetch(input, init);
}
`;

export default cachePlugin;
