// @ts-nocheck
import { viewer } from '../../app/scripts/hglib';

import createDiv from './create-div';

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

  const api = await viewer(div, viewConfig, options);

  return [div, api];
}
