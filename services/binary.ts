/**
 * Bridges typed arrays to the DOM's binary APIs.
 *
 * TypeScript 5.7 made typed arrays generic over their backing buffer, so a bare
 * `Uint8Array` is `Uint8Array<ArrayBufferLike>` -- which includes
 * SharedArrayBuffer and is therefore not assignable to `BufferSource` or
 * `ImageDataArray`. WebCrypto, ImageData and getRandomValues all demand the
 * `<ArrayBuffer>` form.
 *
 * Nothing in this codebase allocates a SharedArrayBuffer (it would require
 * cross-origin isolation headers the app does not set), so every buffer here is
 * genuinely ArrayBuffer-backed and these narrowings are sound. Keeping them in
 * one place documents that reasoning once instead of leaving unexplained casts
 * at each call site.
 */

/** A typed array known to be backed by a plain ArrayBuffer. */
export type Bytes = Uint8Array<ArrayBuffer>;
export type ClampedBytes = Uint8ClampedArray<ArrayBuffer>;

/** For crypto.subtle.encrypt/decrypt/digest/importKey and friends. */
export function asBufferSource(view: Uint8Array): BufferSource {
  return view as unknown as BufferSource;
}

/** For crypto.getRandomValues, which mutates in place and needs the concrete form. */
export function asRandomTarget(view: Uint8Array): Bytes {
  return view as Bytes;
}

/** For the ImageData constructor. */
export function asImageBytes(view: Uint8ClampedArray): ClampedBytes {
  return view as ClampedBytes;
}
