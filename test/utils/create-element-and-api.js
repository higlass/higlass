import { test } from 'vitest';
import * as hglib from '../../app/scripts/hglib';
import createDiv from './create-div';

/**
 * @param {Record<string, unknown>} viewConfig
 * @param {Record<string, unknown>} options
 * @param {number} [width]
 * @param {number} [height]
 * @param {boolean} [scrollable]
 * @return {Promise<[HTMLDivElement, hglib.HiGlassApi]>}
 */
export default async function createElementAndApi(
  viewConfig,
  options,
  width,
  height,
  scrollable = false,
) {
  const div = createDiv();

  const divWidth = width || 600;
  const divHeight = height || 400;

  div.setAttribute(
    'style',
    `width:${divWidth}px; height: ${divHeight}px; background-color: lightgreen; overflow: ${
      scrollable ? 'hidden' : 'auto'
    }`,
  );

  const api = await hglib.viewer(div, viewConfig, options);

  return [div, api];
}

/**
 * @param {Record<string, unknown>} viewconf
 * @returns {import("vitest").TestAPI<{api: hglib.HiGlassApi }>}
 */
export function createHiGlassTestApi(viewconf) {
  return test.extend({
    // biome-ignore lint/correctness/noEmptyPattern: Needed for vitest
    api: async ({}, use) => {
      const [div, api] = await createElementAndApi(viewconf, { bounded: true });
      document.body.append(div);
      await use(api);
      api.destroy();
      document.body.replaceChildren();
    },
  });
}
