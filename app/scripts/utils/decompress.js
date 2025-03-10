import assert from './assert.js';

/**
 * Decompress a compressed data source.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream DecompressionStream API}
 *
 * @example
 * ```typescript
 * const compressed = new Uint8Array([
 *   0x1f, 0x8b, 0x08, 0x00, 0x1e, 0xc0, 0x7e, 0x67, 0x00, 0x03, 0xf3, 0x48,
 *   0xcd, 0xc9, 0xc9, 0xd7, 0x51, 0x28, 0xcf, 0x2f, 0xca, 0x49, 0x51, 0x04,
 *   0x00, 0xe6, 0xc6, 0xe6, 0xeb, 0x0d, 0x00, 0x00, 0x00
 * ]);
 * console.log(await decompress(compressed, { format: "gzip" }).text()); // "Hello, world!"
 * ```
 *
 * @param {BodyInit | Response} data - The compressed data.
 * @param {Object} options
 * @param {CompressionFormat} options.format
 * @param {AbortSignal=} options.signal
 * @returns {Response} A new response for decompressed data.
 *
 * @copyright Trevor Manz 2025
 * @license MIT
 * @see {@link https://github.com/manzt/manzt/blob/1380bb/utils/decompress.js}
 */
export default function decompress(data, options) {
  const { format, signal } = options;
  const response = data instanceof Response ? data : new Response(data);
  assert(response.body, 'Response does not include a body.');
  return new Response(
    response.body.pipeThrough(new DecompressionStream(format), { signal }),
  );
}
