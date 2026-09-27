/**
 * Web Worker for off-main-thread LSB bitstream embedding.
 *
 * Keeps the UI responsive while multi-megabyte carriers are processed. The
 * bit-packing itself lives in bitCodec so this and the main-thread fallback
 * cannot drift apart.
 */

import { embedChunks, extractBits, DENSITY_BITS, type CapacityDensity } from './bitCodec';

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

interface ExtractBitsPayload {
  pxData: ArrayBuffer;
  totalRgbChannels: number;
  density: CapacityDensity;
}

self.onmessage = (e: MessageEvent) => {
  const { type, id, payload } = e.data ?? {};

  if (type === 'ENCODE_PIXELS') {
    try {
      const { pxData, streamBytes, density } = payload as EncodePixelsPayload;
      const px = new Uint8ClampedArray(pxData);
      const stream = new Uint8Array(streamBytes);
      const bits = DENSITY_BITS[density] ?? DENSITY_BITS.lsb2;

      const required = Math.ceil(stream.length * 8 / bits);
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
  } else if (type === 'EXTRACT_BITS') {
    try {
      const { pxData, totalRgbChannels, density } = payload as ExtractBitsPayload;
      const px = new Uint8ClampedArray(pxData);
      const bits = DENSITY_BITS[density] ?? DENSITY_BITS.lsb2;

      const extracted = extractBits(px, totalRgbChannels, bits);
      if (!extracted) {
        self.postMessage({ id, type: 'EXTRACT_BITS_SUCCESS', result: null });
      } else {
        self.postMessage({ id, type: 'EXTRACT_BITS_SUCCESS', result: extracted.buffer }, [extracted.buffer]);
      }
    } catch (err) {
      self.postMessage({
        id,
        type: 'EXTRACT_BITS_ERROR',
        error: err instanceof Error ? err.message : 'Worker extraction failed.',
      });
    }
  }
};
