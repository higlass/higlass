import { viewer } from '../../app/scripts/hglib';

import createDiv from './create-div';

export default function createElementAndAPI(viewConfig, options) {
  const div = createDiv();
  div.setAttribute('style', 'width:600px; height: 400px; background-color: lightgreen');

  const api = viewer(div, viewConfig, options);

  return [div, api];
}
