import map from './map';

// Trevor(2025-02-18): Really not sure what the purpose of this module is.

const getXylofon = () =>
  /** @type {const} */ ([
    window,
    map((c) => c.charCodeAt(0))(
      // @ts-expect-error - A global added by `vite.config.js`.
      XYLOPHON,
    )
      .map((number) => (number <= 999 ? `00${number}`.slice(-3) : number))
      .join(''),
  ]);

export default getXylofon;
