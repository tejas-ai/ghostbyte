/**
 * Web Worker for off-main-thread LSB bitstream embedding.
 *
 * Keeps the UI responsive while multi-megabyte carriers are processed. The
 * bit-packing itself lives in bitCodec so this and the main-thread fallback
 * cannot drift apart.
 */

import { embedChunks, bytesToChunks, DENSITY_BITS, type CapacityDensity } from './bitCodec';

// Minimal worker-scope typing. The project compiles against the DOM lib, where
// `self` is a Window and postMessage has no transfer-list overload; pulling in
// the full webworker lib here would collide with DOM globals, so declare just
// the surface this file uses.
declare const self: {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};

interface EncodePixelsPayload {
  pxData: ArrayBuffer;
  streamBytes: ArrayBuffer;
  density: CapacityDensity;
}

self.onmessage = (e: MessageEvent) => {
  const { type, id, payload } = e.data ?? {};
  if (type !== 'ENCODE_PIXELS') return;

  try {
    const { pxData, streamBytes, density } = payload as EncodePixelsPayload;
    const px = new Uint8ClampedArray(pxData);
    const stream = new Uint8Array(streamBytes);
    const bits = DENSITY_BITS[density] ?? DENSITY_BITS.lsb2;

    const required = bytesToChunks(stream, bits).length;
    const written = embedChunks(px, stream, bits);
    if (written < required) {
      throw new Error(
        `Carrier holds ${written} of ${required} channels needed. The payload does not fit at this density.`
      );
    }

    self.postMessage({ id, type: 'ENCODE_PIXELS_SUCCESS', result: px.buffer }, [px.buffer]);
  } catch (err) {
    self.postMessage({
      id,
      type: 'ENCODE_PIXELS_ERROR',
      error: err instanceof Error ? err.message : 'Worker embedding failed.',
    });
  }
};
