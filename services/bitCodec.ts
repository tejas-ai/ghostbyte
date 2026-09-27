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
  const len = bytes.length;
  if (bits === 2) {
    const chunks = new Uint8Array(len * 4);
    let ci = 0;
    for (let i = 0; i < len; i++) {
      const b = bytes[i];
      chunks[ci++] = (b >> 6) & 0x03;
      chunks[ci++] = (b >> 4) & 0x03;
      chunks[ci++] = (b >> 2) & 0x03;
      chunks[ci++] = b & 0x03;
    }
    return chunks;
  }
  if (bits === 4) {
    const chunks = new Uint8Array(len * 2);
    let ci = 0;
    for (let i = 0; i < len; i++) {
      const b = bytes[i];
      chunks[ci++] = (b >> 4) & 0x0f;
      chunks[ci++] = b & 0x0f;
    }
    return chunks;
  }
  if (bits === 1) {
    const chunks = new Uint8Array(len * 8);
    let ci = 0;
    for (let i = 0; i < len; i++) {
      const b = bytes[i];
      chunks[ci++] = (b >> 7) & 1;
      chunks[ci++] = (b >> 6) & 1;
      chunks[ci++] = (b >> 5) & 1;
      chunks[ci++] = (b >> 4) & 1;
      chunks[ci++] = (b >> 3) & 1;
      chunks[ci++] = (b >> 2) & 1;
      chunks[ci++] = (b >> 1) & 1;
      chunks[ci++] = b & 1;
    }
    return chunks;
  }

  // Generic fallback for non-power-of-two (e.g. bits === 6)
  const totalBits = len * 8;
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
  if (bits === 2) {
    let ci = 0;
    const maxCi = chunks.length;
    for (let i = 0; i < byteCount; i++) {
      if (ci >= maxCi) break;
      const c0 = chunks[ci++] || 0;
      const c1 = ci < maxCi ? chunks[ci++] : 0;
      const c2 = ci < maxCi ? chunks[ci++] : 0;
      const c3 = ci < maxCi ? chunks[ci++] : 0;
      bytes[i] = (c0 << 6) | (c1 << 4) | (c2 << 2) | c3;
    }
    return bytes;
  }
  if (bits === 4) {
    let ci = 0;
    const maxCi = chunks.length;
    for (let i = 0; i < byteCount; i++) {
      if (ci >= maxCi) break;
      const c0 = chunks[ci++] || 0;
      const c1 = ci < maxCi ? chunks[ci++] : 0;
      bytes[i] = (c0 << 4) | c1;
    }
    return bytes;
  }
  if (bits === 1) {
    let ci = 0;
    const maxCi = chunks.length;
    for (let i = 0; i < byteCount; i++) {
      if (ci >= maxCi) break;
      let b = 0;
      for (let bit = 7; bit >= 0; bit--) {
        if (ci < maxCi) {
          b |= (chunks[ci++] & 1) << bit;
        }
      }
      bytes[i] = b;
    }
    return bytes;
  }

  // Generic fallback for non-power-of-two (e.g. bits === 6)
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
  const numChunks = chunks.length;
  let written = 0;
  let pxIdx = 0;
  let channel = 0;

  for (let ci = 0; ci < numChunks; ci++) {
    if (pxIdx >= px.length) break;
    px[pxIdx + channel] = (px[pxIdx + channel] & keep) | chunks[ci];
    written++;
    channel++;
    if (channel === 3) {
      channel = 0;
      pxIdx += 4; // Skip Alpha
    }
  }
  return written;
}

/**
 * Extract raw bitstream payload from pixel matrix at specified bit depth.
 * Returns null if no valid length header or stream is truncated.
 */
export function extractBits(
  px: Uint8ClampedArray,
  totalRgbChannels: number,
  bits: number
): Uint8Array | null {
  const mask = (1 << bits) - 1;
  const headerChunkCount = Math.ceil(32 / bits);
  const headerChunks = new Uint8Array(headerChunkCount);

  for (let ci = 0; ci < headerChunkCount; ci++) {
    const pxIdx = ((ci / 3) | 0) * 4 + (ci % 3);
    if (pxIdx >= px.length) return null;
    headerChunks[ci] = px[pxIdx] & mask;
  }

  const headerBytes = chunksToBytes(headerChunks, 4, bits);
  const len = (headerBytes[0] | (headerBytes[1] << 8) | (headerBytes[2] << 16) | (headerBytes[3] << 24)) >>> 0;
  const maxBytes = Math.floor((totalRgbChannels * bits - 32) / 8);

  if (len === 0 || len > maxBytes) {
    return null;
  }

  const totalChunks = Math.ceil(((4 + len) * 8) / bits);
  const allChunks = new Uint8Array(totalChunks);
  allChunks.set(headerChunks, 0);

  for (let ci = headerChunkCount; ci < totalChunks; ci++) {
    const pxIdx = ((ci / 3) | 0) * 4 + (ci % 3);
    if (pxIdx >= px.length) return null;
    allChunks[ci] = px[pxIdx] & mask;
  }

  const streamBytes = chunksToBytes(allChunks, 4 + len, bits);
  return new Uint8Array(streamBytes.subarray(4));
}

