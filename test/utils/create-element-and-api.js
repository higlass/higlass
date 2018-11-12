import { viewer } from '../../app/scripts/hglib';

export default function createElementAndAPI(viewConfig, options) {
  const div = global.document.createElement('div');
  global.document.body.appendChild(div);

  div.setAttribute('style', 'width:600px; height: 400px; background-color: lightgreen');

  const api = viewer(div, viewConfig, options);

  return [div, api];
}
