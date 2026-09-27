/**
 * Worker bridge with a real main-thread fallback.
 *
 * Every failure mode a worker can hit -- construction throwing, the worker
 * erroring after construction, the worker reporting an error, or simply never
 * answering -- resolves to either the fallback path or a rejection. Previously
 * `onerror` only nulled the instance and left every pending promise unsettled,
 * so a worker that died after construction hung the encode button forever with
 * no error and no recovery short of a page reload.
 */

import { embedChunks, extractBits, DENSITY_BITS, type CapacityDensity } from './bitCodec';

/** Worker embedding/extraction is CPU-bound; well past this, something is wrong. */
const WORKER_TIMEOUT_MS = 120_000;

interface PendingRequest {
  resolve: (buffer: ArrayBuffer | null) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let workerInstance: Worker | null = null;
let workerUnavailable = false;
let reqCounter = 0;
const pendingRequests = new Map<number, PendingRequest>();

function settle(id: number, apply: (p: PendingRequest) => void): void {
  const pending = pendingRequests.get(id);
  if (!pending) return;
  pendingRequests.delete(id);
  clearTimeout(pending.timer);
  apply(pending);
}

/** Fail every in-flight request and drop the worker so the next call falls back. */
function tearDownWorker(reason: string): void {
  const inFlight = [...pendingRequests.keys()];
  for (const id of inFlight) {
    settle(id, (p) => p.reject(new Error(reason)));
  }
  try {
    workerInstance?.terminate();
  } catch {
    // already gone
  }
  workerInstance = null;
}

function getWorker(): Worker | null {
  if (workerUnavailable || typeof Worker === 'undefined') return null;
  if (workerInstance) return workerInstance;

  try {
    const worker = new Worker(new URL('./stegoWorker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (e: MessageEvent) => {
      const { id, type, result, error } = e.data ?? {};
      settle(id, (p) => {
        if (type === 'ENCODE_PIXELS_SUCCESS' || type === 'EXTRACT_BITS_SUCCESS') {
          p.resolve((result as ArrayBuffer) ?? null);
        } else {
          p.reject(new Error(error || 'Worker execution failed'));
        }
      });
    };

    worker.onerror = () => {
      // Do not mark the worker permanently unavailable: a one-off runtime error
      // should not disable off-thread encoding for the session. Callers see the
      // rejection and retry through the fallback.
      tearDownWorker('Steganography worker stopped unexpectedly.');
    };

    worker.onmessageerror = () => {
      tearDownWorker('Steganography worker sent an unreadable message.');
    };

    workerInstance = worker;
    return worker;
  } catch {
    // Construction failing means workers are blocked outright (CSP, or a
    // browser without module-worker support). Stop trying for this session.
    workerUnavailable = true;
    workerInstance = null;
    return null;
  }
}

export async function processPixelsWithWorker(
  pxData: Uint8ClampedArray,
  streamBytes: Uint8Array,
  density: CapacityDensity,
): Promise<Uint8ClampedArray> {
  const worker = getWorker();
  if (!worker) return fallbackEncode(pxData, streamBytes, density);

  const id = ++reqCounter;

  try {
    return await new Promise<Uint8ClampedArray>((resolve, reject) => {
      const timer = setTimeout(() => {
        settle(id, (p) => p.reject(new Error('Steganography worker timed out.')));
      }, WORKER_TIMEOUT_MS);

      pendingRequests.set(id, {
        resolve: (buffer) => resolve(buffer ? new Uint8ClampedArray(buffer) : pxData),
        reject,
        timer,
      });

      try {
        // ImageData's buffer is not transferable, so copy first and transfer the
        // copy. The stream is small and goes by structured clone.
        const pxBuf = pxData.buffer.slice(pxData.byteOffset, pxData.byteOffset + pxData.byteLength);
        const streamBuf = streamBytes.buffer.slice(
          streamBytes.byteOffset,
          streamBytes.byteOffset + streamBytes.byteLength,
        );
        worker.postMessage(
          { type: 'ENCODE_PIXELS', id, payload: { pxData: pxBuf, streamBytes: streamBuf, density } },
          [pxBuf],
        );
      } catch (err) {
        settle(id, (p) => p.reject(err instanceof Error ? err : new Error('Could not dispatch to worker.')));
      }
    });
  } catch {
    // Any worker-side failure falls back to the main thread rather than
    // surfacing as an encode error: the result is identical, just slower.
    return fallbackEncode(pxData, streamBytes, density);
  }
}

/** Same embedding, on the main thread. Blocks, but always produces a result. */
function fallbackEncode(
  px: Uint8ClampedArray,
  stream: Uint8Array,
  density: CapacityDensity,
): Uint8ClampedArray {
  const bits = DENSITY_BITS[density] ?? DENSITY_BITS.lsb2;
  const required = Math.ceil(stream.length * 8 / bits);
  const written = embedChunks(px, stream, bits);
  if (written < required) {
    throw new Error(
      `Carrier holds ${written} of ${required} channels needed. The payload does not fit at this density.`
    );
  }
  return px;
}

export async function extractBitsWithWorker(
  pxData: Uint8ClampedArray,
  totalRgbChannels: number,
  density: CapacityDensity,
): Promise<Uint8Array | null> {
  const worker = getWorker();
  const bits = DENSITY_BITS[density] ?? DENSITY_BITS.lsb2;
  if (!worker) return extractBits(pxData, totalRgbChannels, bits);

  const id = ++reqCounter;

  try {
    return await new Promise<Uint8Array | null>((resolve, reject) => {
      const timer = setTimeout(() => {
        settle(id, (p) => p.reject(new Error('Steganography extraction worker timed out.')));
      }, WORKER_TIMEOUT_MS);

      pendingRequests.set(id, {
        resolve: (buffer) => resolve(buffer ? new Uint8Array(buffer) : null),
        reject,
        timer,
      });

      try {
        const pxBuf = pxData.buffer.slice(pxData.byteOffset, pxData.byteOffset + pxData.byteLength);
        worker.postMessage(
          { type: 'EXTRACT_BITS', id, payload: { pxData: pxBuf, totalRgbChannels, density } },
          [pxBuf],
        );
      } catch (err) {
        settle(id, (p) => p.reject(err instanceof Error ? err : new Error('Could not dispatch to extraction worker.')));
      }
    });
  } catch {
    return extractBits(pxData, totalRgbChannels, bits);
  }
}

