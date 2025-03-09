import assert from './assert.js';

/**
 * @param {ArrayBuffer |ArrayBufferView | Response} data
 * @param {Object} options
 * @param {CompressionFormat} options.format
 * @param {AbortSignal} [options.signal]
 *
 * @returns {Promise<ArrayBuffer>}
 */
export default async function decodeGzip(data, { format, signal }) {
  const response = data instanceof Response ? data : new Response(data);
  assert(response.body, 'Response does not contain body.');
  try {
    const decompressedResponse = new Response(
      response.body.pipeThrough(new DecompressionStream(format), { signal }),
    );
    const buffer = await decompressedResponse.arrayBuffer();
    return buffer;
  } catch {
    signal?.throwIfAborted();
    throw new Error(`Failed to decode ${format}`);
  }
}
