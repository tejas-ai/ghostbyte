/**
 * Worker Client Bridge with Transparent Main-Thread Fallback
 */

let workerInstance: Worker | null = null;
let reqCounter = 0;
const pendingRequests = new Map<number, { resolve: (res: any) => void; reject: (err: any) => void }>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('./stegoWorker.ts', import.meta.url), { type: 'module' });
      workerInstance.onmessage = (e: MessageEvent) => {
        const { id, type, result, error } = e.data;
        const pending = pendingRequests.get(id);
        if (pending) {
          pendingRequests.delete(id);
          if (type.endsWith('_SUCCESS')) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error || 'Worker execution failed'));
          }
        }
      };
      workerInstance.onerror = () => {
        // In case of worker failure, fallback seamlessly
        workerInstance = null;
      };
    } catch {
      workerInstance = null;
    }
  }
  return workerInstance;
}

export async function processPixelsWithWorker(
  pxData: Uint8ClampedArray,
  streamBytes: Uint8Array,
  density: 'lsb4' | 'lsb6'
): Promise<Uint8ClampedArray> {
  const worker = getWorker();
  if (!worker) {
    // Synchronous fallback on main thread
    return fallbackEncode(pxData, streamBytes, density);
  }

  const id = ++reqCounter;
  return new Promise<Uint8ClampedArray>((resolve, reject) => {
    pendingRequests.set(id, {
      resolve: (buffer: ArrayBuffer) => resolve(new Uint8ClampedArray(buffer)),
      reject,
    });

    try {
      // Transfer pxData buffer if possible, or send copy
      const pxBuf = pxData.buffer.slice(pxData.byteOffset, pxData.byteOffset + pxData.byteLength);
      const streamBuf = streamBytes.buffer.slice(streamBytes.byteOffset, streamBytes.byteOffset + streamBytes.byteLength);

      worker.postMessage(
        {
          type: 'ENCODE_PIXELS',
          id,
          payload: { pxData: pxBuf, streamBytes: streamBuf, density },
        },
        [pxBuf]
      );
    } catch (err) {
      pendingRequests.delete(id);
      resolve(fallbackEncode(pxData, streamBytes, density));
    }
  });
}

function fallbackEncode(
  px: Uint8ClampedArray,
  stream: Uint8Array,
  density: 'lsb4' | 'lsb6'
): Uint8ClampedArray {
  if (density === 'lsb6') {
    const totalBits = stream.length * 8;
    const numChunks = Math.ceil(totalBits / 6);
    let bitPos = 0;
    for (let i = 0; i < numChunks; i++) {
      let val = 0;
      for (let b = 0; b < 6; b++) {
        const currBit = bitPos + b;
        if (currBit < totalBits) {
          const byteIdx = currBit >> 3;
          const bitInByte = 7 - (currBit & 7);
          const bitVal = (stream[byteIdx] >> bitInByte) & 1;
          val = (val << 1) | bitVal;
        } else {
          val = val << 1;
        }
      }
      const pxIdx = ((i / 3) | 0) * 4 + (i % 3);
      if (pxIdx < px.length) {
        px[pxIdx] = (px[pxIdx] & 0xc0) | (val & 0x3f);
      }
      bitPos += 6;
    }
  } else {
    const nLen = stream.length * 2;
    for (let ni = 0; ni < nLen; ni++) {
      const byteIdx = ni >> 1;
      const nibble = (ni & 1) === 0 ? (stream[byteIdx] >> 4) & 0x0f : stream[byteIdx] & 0x0f;
      const pxIdx = ((ni / 3) | 0) * 4 + (ni % 3);
      if (pxIdx < px.length) {
        px[pxIdx] = (px[pxIdx] & 0xf0) | nibble;
      }
    }
  }
  return px;
}
