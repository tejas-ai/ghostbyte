/**
 * Dedicated Web Worker for Off-Main-Thread Steganographic Bitstream Multiplexing
 * Guarantees 60 FPS UI responsiveness even during multi-megabyte carrier processing.
 */

// Helper: Convert bytes to 4-bit nibbles
function bytesToNibbles(bytes: Uint8Array): Uint8Array {
  const nibbles = new Uint8Array(bytes.length * 2);
  for (let i = 0; i < bytes.length; i++) {
    nibbles[i * 2]     = (bytes[i] >> 4) & 0x0f;
    nibbles[i * 2 + 1] = bytes[i] & 0x0f;
  }
  return nibbles;
}

// Helper: Convert bytes to 6-bit chunks
function bytesTo6BitChunks(bytes: Uint8Array): Uint8Array {
  const totalBits = bytes.length * 8;
  const numChunks = Math.ceil(totalBits / 6);
  const chunks = new Uint8Array(numChunks);
  let bitPos = 0;
  for (let i = 0; i < numChunks; i++) {
    let val = 0;
    for (let b = 0; b < 6; b++) {
      const currBit = bitPos + b;
      if (currBit < totalBits) {
        const byteIdx = currBit >> 3;
        const bitInByte = 7 - (currBit & 7);
        const bitVal = (bytes[byteIdx] >> bitInByte) & 1;
        val = (val << 1) | bitVal;
      } else {
        val = val << 1;
      }
    }
    chunks[i] = val & 0x3f;
    bitPos += 6;
  }
  return chunks;
}

self.onmessage = function (e: MessageEvent) {
  const { type, id, payload } = e.data;

  if (type === 'ENCODE_PIXELS') {
    const { pxData, streamBytes, density } = payload;
    const px = new Uint8ClampedArray(pxData);
    const stream = new Uint8Array(streamBytes);

    if (density === 'lsb6') {
      const chunks6 = bytesTo6BitChunks(stream);
      const cLen = chunks6.length;
      for (let ci = 0; ci < cLen; ci++) {
        const pxIdx = ((ci / 3) | 0) * 4 + (ci % 3);
        if (pxIdx < px.length) {
          px[pxIdx] = (px[pxIdx] & 0xc0) | chunks6[ci];
        }
      }
    } else {
      const nibbles = bytesToNibbles(stream);
      const nLen = nibbles.length;
      for (let ni = 0; ni < nLen; ni++) {
        const pxIdx = ((ni / 3) | 0) * 4 + (ni % 3);
        if (pxIdx < px.length) {
          px[pxIdx] = (px[pxIdx] & 0xf0) | nibbles[ni];
        }
      }
    }

    self.postMessage(
      { id, type: 'ENCODE_PIXELS_SUCCESS', result: px.buffer },
      // Transferable
      [px.buffer]
    );
  }
};
