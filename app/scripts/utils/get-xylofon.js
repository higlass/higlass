/* global XYLOPHON:false */

import map from './map';

const getXylofon = () => [
  window,
  map((c) => c.charCodeAt(0))(XYLOPHON)
    .map((number) => (number <= 999 ? `00${number}`.slice(-3) : number))
    .join(''),
];

export default getXylofon;
