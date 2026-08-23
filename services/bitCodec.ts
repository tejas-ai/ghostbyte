/**
 * Shared LSB bit-packing primitives.
 *
 * Lives in its own module so the engine and the Web Worker encode against
 * exactly the same definition. They used to carry separate copies, which is how
 * the worker and the main-thread fallback drifted apart.
 */

export type CapacityDensity = 'lsb1' | 'lsb2' | 'lsb4' | 'lsb6';

/** Payload bits written per RGB channel, per density. */
export const DENSITY_BITS: Record<CapacityDensity, number> = {
  lsb1: 1,
  lsb2: 2,
  lsb4: 4,
  lsb6: 6,
};

/**
 * Densities the decoder probes, in order. Higher densities first so containers
 * written by earlier versions (which only ever used 4 or 6) match on the first
 * or second attempt.
 */
export const DENSITY_PROBE_ORDER: CapacityDensity[] = ['lsb6', 'lsb4', 'lsb2', 'lsb1'];

/**
 * Default embedding density.
 *
 * LSB-2 replaces the low two bits of each channel: about 44 dB PSNR across the
 * region the payload covers, which stays inside the noise floor of a typical
 * camera sensor. LSB-6 (about 20 dB) was the previous default and is visibly
 * destructive as well as trivially detectable by bit-plane inspection, so it
 * survives only as an explicit high-capacity opt-in.
 */
export const DEFAULT_DENSITY: CapacityDensity = 'lsb2';

/** Bits of the original channel value preserved at this density. */
export function keepMaskFor(bits: number): number {
  return 0xff & ~((1 << bits) - 1);
}

/**
 * Split `bytes` into `bits`-wide chunks, one per RGB channel.
 *
 * Bit order is MSB-first within each byte and each chunk. That makes bits=4
 * identical to the original high-nibble-first LSB-4 format and bits=6 identical
 * to the original LSB-6 format, so containers encoded before densities were
 * generalised still decode.
 */
export function bytesToChunks(bytes: Uint8Array, bits: number): Uint8Array {
  const totalBits = bytes.length * 8;
  const numChunks = Math.ceil(totalBits / bits);
  const chunks = new Uint8Array(numChunks);
  let bitPos = 0;
  for (let i = 0; i < numChunks; i++) {
    let val = 0;
    for (let b = 0; b < bits; b++) {
      const currBit = bitPos + b;
      const bitVal = currBit < totalBits
        ? (bytes[currBit >> 3] >> (7 - (currBit & 7))) & 1
        : 0;
      val = (val << 1) | bitVal;
    }
    chunks[i] = val;
    bitPos += bits;
  }
  return chunks;
}

/** Reassemble `byteCount` bytes from `bits`-wide chunks. Inverse of bytesToChunks. */
export function chunksToBytes(chunks: Uint8Array | number[], byteCount: number, bits: number): Uint8Array {
  const bytes = new Uint8Array(byteCount);
  const totalBits = byteCount * 8;
  let bitPos = 0;
  for (let i = 0; i < chunks.length && bitPos < totalBits; i++) {
    const v = chunks[i];
    for (let b = 0; b < bits && bitPos < totalBits; b++) {
      const bitVal = (v >> (bits - 1 - b)) & 1;
      bytes[bitPos >> 3] |= bitVal << (7 - (bitPos & 7));
      bitPos++;
    }
  }
  return bytes;
}

/**
 * Write `stream` into the low `bits` of each RGB channel of `px`, in place.
 * Alpha is never touched: altering it would be visible and some encoders
 * premultiply it.
 *
 * Returns the number of chunks written. A short return means the pixel buffer
 * ran out before the stream did, which the caller must treat as an error --
 * silently truncating here is what produces containers that never decode.
 */
export function embedChunks(px: Uint8ClampedArray, stream: Uint8Array, bits: number): number {
  const chunks = bytesToChunks(stream, bits);
  const keep = keepMaskFor(bits);
  let written = 0;
  for (let ci = 0; ci < chunks.length; ci++) {
    const pxIdx = ((ci / 3) | 0) * 4 + (ci % 3);
    if (pxIdx >= px.length) break;
    px[pxIdx] = (px[pxIdx] & keep) | chunks[ci];
    written++;
  }
  return written;
}
