import { v4 } from '@lukeed/uuid';

/**
 *
 * Returns a randomly generated uuid v4 compliant slug which conforms to a set
 * of "nice" properties, at the cost of some entropy. Currently this means one
 * extra fixed bit (the first bit of the uuid is set to 0) which guarantees the
 * slug will begin with [A-Za-f]. For example such slugs don't require special
 * handling when used as command line parameters (whereas non-nice slugs may
 * start with `-` which can confuse command line tools).
 *
 * Adapted from `slugid` to avoid the need a Buffer polyfill.
 *
 * @see https://github.com/taskcluster/slugid/blob/ce3bf62c6c50b7da014ce568e4510944d306d6f0/slugid.js#L63-L83
 */
function nice() {
  // convert string uuid to bytes (without Buffer);
  const uuid = v4();
  const integers = uuid
    .replace(/-/gi, '')    // remove '-' separator of string hex
    .match(/[\dA-F]{2}/gi) // match each hex pair
    .map(s => parseInt(s, 16));
  const bytes = new Uint8Array(integers);

  bytes[0] &= 0x7f; // unset first bit to ensure [A-Za-f] first char

  return btoa(bytes)
    .replace(/\+/g, '-')  // Replace + with - (see RFC 4648, sec. 5)
    .replace(/\//g, '_')  // Replace / with _ (see RFC 4648, sec. 5)
    .substring(0, 22);    // Drop '==' padding
}

export default {
  v4,
  nice,
}
