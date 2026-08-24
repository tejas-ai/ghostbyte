import UTIF from 'utif';
import { processPixelsWithWorker, extractBitsWithWorker } from './workerClient';
import {
  chunksToBytes,
  DENSITY_BITS as BITS,
  DENSITY_PROBE_ORDER as PROBE_ORDER,
  DEFAULT_DENSITY as DEFAULT_D,
  type CapacityDensity,
} from './bitCodec';
import { isAsymmetricPayload, decryptWithPrivateKey } from './asymmetricCrypto';
import { asRandomTarget, asImageBytes } from './binary';

const enc = new TextEncoder();
const dec = new TextDecoder();

const GHOST_VAULT_SIG = enc.encode('GHOST_VAULT'); // 11 bytes
const GHOST_FILE_SIG  = enc.encode('GHOST_FILE');  // 10 bytes
const GHOST_HONEY_SIG = enc.encode('GHOST_HONEY'); // 11 bytes

export type { CapacityDensity } from './bitCodec';
export { DENSITY_BITS, DENSITY_PROBE_ORDER, DEFAULT_DENSITY } from './bitCodec';

/** Constant-time byte buffer comparison to prevent timing side-channel attacks */
export function constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/**
 * Pure JS SHA-256, used only when crypto.subtle is unavailable (a non-secure
 * origin, e.g. reaching a dev server over plain HTTP on a LAN).
 *
 * Builds an explicitly padded message buffer and a dense 64-word schedule per
 * block. An earlier version assembled the schedule in a sparse array, so any
 * input shorter than one block left holes that read back as `undefined` and
 * propagated NaN through every round - it returned a wrong digest for every
 * input. Covered by RFC 6234 vectors in the self-test suite.
 */
function jsSha256(bytes: Uint8Array): string {
  const rotr = (v: number, n: number): number => (v >>> n) | (v << (32 - n));

  const bitLen = bytes.length * 8;
  // message + 0x80 + zero padding + 8-byte big-endian bit length, to a 64-byte multiple
  const paddedLen = (bytes.length + 9 + 63) & ~63;
  const msg = new Uint8Array(paddedLen);
  msg.set(bytes, 0);
  msg[bytes.length] = 0x80;

  // 64-bit big-endian length. JS bitwise ops are 32-bit, so derive the high
  // word by division rather than shifting.
  const dv = new DataView(msg.buffer);
  dv.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  dv.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);

  for (let off = 0; off < paddedLen; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const g0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const g1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + g0 + w[i - 7] + g1) >>> 0;
    }

    let a = h[0], b = h[1], c = h[2], d = h[3];
    let e = h[4], f = h[5], g = h[6], hh = h[7];

    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + s1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) >>> 0;

      hh = g; g = f; f = e;
      e = (d + t1) >>> 0;
      d = c; c = b; b = a;
      a = (t1 + t2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }

  let out = '';
  for (let i = 0; i < 8; i++) out += h[i].toString(16).padStart(8, '0');
  return out;
}

/** Calculate cryptographic SHA-256 hex checksum (with robust mobile fallback) */
export async function calcSha256(data: Uint8Array): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto?.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const hashBuf = await crypto.subtle.digest('SHA-256', data as BufferSource);
      const hashArr = Array.from(new Uint8Array(hashBuf));
      return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // fallback to pure JS implementation
    }
  }
  return jsSha256(data);
}

/** Filename sanitizer: prevents directory traversal, null-byte injection & OS-reserved file names */
export function sanitizeFilename(rawName: string): string {
  if (!rawName) return 'unnamed_file.bin';
  let clean = rawName
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Strip control chars & null bytes
    .replace(/[/\\?%*:|"<>]/g, '_')       // Strip path separators & illegal chars
    .replace(/^\.+/, '')                  // Strip leading dots (prevent hidden/climbing files)
    .trim();

  // Strip Windows reserved device names
  const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;
  if (reserved.test(clean)) {
    clean = `safe_${clean}`;
  }

  return clean.slice(0, 255) || 'unnamed_file.bin';
}

/** Zero-fill memory helper for sensitive typed arrays (heap sanitization) */
export function zeroFill(buf: Uint8Array | null | undefined): void {
  if (buf && buf.fill) {
    try {
      buf.fill(0);
    } catch {
      // ignore
    }
  }
}

/** Parse TIFF / TIF binary buffer into lightweight canvas preview & full dimensions */
export function parseTiffToDataUrl(buffer: ArrayBuffer): { dataUrl: string; width: number; height: number } | null {
  try {
    const ifds = UTIF.decode(buffer);
    if (!ifds || ifds.length === 0) return null;
    const ifd = ifds[0];
    UTIF.decodeImage(buffer, ifd);
    const rgba = UTIF.toRGBA8(ifd);

    const origW = ifd.width;
    const origH = ifd.height;

    // Downscale preview for UI display (max 1920px) using fast direct sub-sampling
    const maxPreview = 1920;
    let pw = origW;
    let ph = origH;
    if (pw > maxPreview || ph > maxPreview) {
      const scale = Math.min(maxPreview / pw, maxPreview / ph);
      pw = Math.round(pw * scale);
      ph = Math.round(ph * scale);
    }

    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = pw;
    previewCanvas.height = ph;
    const previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true })!;

    if (pw === origW && ph === origH) {
      const imgData = new ImageData(new Uint8ClampedArray(rgba), origW, origH);
      previewCtx.putImageData(imgData, 0, 0);
    } else {
      const previewData = new Uint8ClampedArray(pw * ph * 4);
      const stepX = origW / pw;
      const stepY = origH / ph;

      for (let py = 0; py < ph; py++) {
        const sy = Math.floor(py * stepY);
        const srcRow = sy * origW;
        const dstRow = py * pw;
        for (let px = 0; px < pw; px++) {
          const sx = Math.floor(px * stepX);
          const srcIdx = (srcRow + sx) * 4;
          const dstIdx = (dstRow + px) * 4;
          previewData[dstIdx]     = rgba[srcIdx];
          previewData[dstIdx + 1] = rgba[srcIdx + 1];
          previewData[dstIdx + 2] = rgba[srcIdx + 2];
          previewData[dstIdx + 3] = rgba[srcIdx + 3];
        }
      }
      previewCtx.putImageData(new ImageData(previewData, pw, ph), 0, 0);
    }

    return {
      dataUrl: previewCanvas.toDataURL('image/jpeg', 0.85),
      width: origW,
      height: origH,
    };
  } catch {
    return null;
  }
}

// ── Precomputed CRC32 Lookup Table for Ultra-Fast PKZIP Creation ─────────────
const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crc32Table[i] = c >>> 0;
}

/** Calculate CRC32 checksum of typed array using precomputed lookup table */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Pure JS/TS ZIP Archive Builder (Uncompressed PKZIP format - 100% WhatsApp/OS compatible) */
export function buildZipArchive(filename: string, fileData: Uint8Array): Uint8Array {
  const nameBytes = enc.encode(filename);
  const fileCrc = crc32(fileData);
  const dataLen = fileData.length;

  const localHeaderLen = 30 + nameBytes.length;
  const localHeader = new Uint8Array(localHeaderLen);
  const viewLocal = new DataView(localHeader.buffer);

  viewLocal.setUint32(0, 0x04034b50, true);
  viewLocal.setUint16(4, 20, true);
  viewLocal.setUint16(6, 0, true);
  viewLocal.setUint16(8, 0, true);
  viewLocal.setUint16(10, 0, true);
  viewLocal.setUint16(12, 0, true);
  viewLocal.setUint32(14, fileCrc, true);
  viewLocal.setUint32(18, dataLen, true);
  viewLocal.setUint32(22, dataLen, true);
  viewLocal.setUint16(26, nameBytes.length, true);
  viewLocal.setUint16(28, 0, true);
  localHeader.set(nameBytes, 30);

  const cdHeaderLen = 46 + nameBytes.length;
  const cdHeader = new Uint8Array(cdHeaderLen);
  const viewCD = new DataView(cdHeader.buffer);

  viewCD.setUint32(0, 0x02014b50, true);
  viewCD.setUint16(4, 20, true);
  viewCD.setUint16(6, 20, true);
  viewCD.setUint16(8, 0, true);
  viewCD.setUint16(10, 0, true);
  viewCD.setUint16(12, 0, true);
  viewCD.setUint16(14, 0, true);
  viewCD.setUint32(16, fileCrc, true);
  viewCD.setUint32(20, dataLen, true);
  viewCD.setUint32(24, dataLen, true);
  viewCD.setUint16(28, nameBytes.length, true);
  viewCD.setUint16(30, 0, true);
  viewCD.setUint16(32, 0, true);
  viewCD.setUint16(34, 0, true);
  viewCD.setUint16(36, 0, true);
  viewCD.setUint32(38, 0x81a40000, true);
  viewCD.setUint32(42, 0, true);
  cdHeader.set(nameBytes, 46);

  const eocd = new Uint8Array(22);
  const viewEOCD = new DataView(eocd.buffer);
  const offsetCD = localHeaderLen + dataLen;

  viewEOCD.setUint32(0, 0x06054b50, true);
  viewEOCD.setUint16(4, 0, true);
  viewEOCD.setUint16(6, 0, true);
  viewEOCD.setUint16(8, 1, true);
  viewEOCD.setUint16(10, 1, true);
  viewEOCD.setUint32(12, cdHeaderLen, true);
  viewEOCD.setUint32(16, offsetCD, true);
  viewEOCD.setUint16(20, 0, true);

  const totalLen = localHeaderLen + dataLen + cdHeaderLen + 22;
  const out = new Uint8Array(totalLen);
  let off = 0;
  out.set(localHeader, off); off += localHeaderLen;
  out.set(fileData, off); off += dataLen;
  out.set(cdHeader, off); off += cdHeaderLen;
  out.set(eocd, off);

  return out;
}

/** Pure JS/TS ZIP Archive Parser (Extracts first embedded file from ZIP) */
export function parseZipArchive(buf: Uint8Array): Uint8Array | null {
  if (buf.length < 30) return null;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (view.getUint32(0, true) !== 0x04034b50) return null;

  // Only stored (method 0) entries can be handed back as-is. Without this check
  // a deflated entry returned its compressed bytes presented as the file.
  const method = view.getUint16(8, true);
  if (method !== 0) return null;

  const flags = view.getUint16(6, true);
  if (flags & 0x0008) return null; // sizes live in a trailing data descriptor

  const nameLen = view.getUint16(26, true);
  const extraLen = view.getUint16(28, true);
  const compLen = view.getUint32(18, true);

  const dataStart = 30 + nameLen + extraLen;
  if (dataStart + compLen > buf.length) return null;

  const data = buf.subarray(dataStart, dataStart + compLen);

  // The local header carries a CRC-32 of the stored bytes; verify it rather
  // than trusting the offsets we just read out of untrusted input.
  const expectedCrc = view.getUint32(14, true);
  if (expectedCrc !== 0 && crc32(data) !== expectedCrc) return null;

  return data;
}

/** Helper: Calculate dimension scaling */
export function getScaledDimensions(w: number, h: number, maxDim: number): { w: number; h: number } {
  if (maxDim <= 0 || (w <= maxDim && h <= maxDim)) return { w, h };
  const ratio = Math.min(maxDim / w, maxDim / h);
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
}

export const MAX_CARRIER_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
/**
 * True on devices whose canvas allocation is tight enough that a large photo
 * blanks the canvas or kills the tab.
 *
 * The user-agent test alone is not enough. Since iPadOS 13, Safari on iPad
 * reports a desktop string -- "Macintosh; Intel Mac OS X" -- with no `iPad`
 * token anywhere in it, so the obvious regex has not matched a stock iPad in
 * years and hands the largest-photo device the desktop ceiling.
 *
 * `maxTouchPoints` is what separates them: an iPad reports 5, and a real Mac
 * reports 0 even with a trackpad or a connected touchscreen display. Paired
 * with the Macintosh UA that is a reliable iPadOS signal, and it avoids the
 * deprecated `navigator.platform`.
 *
 * Evaluated once at module load, which is fine -- none of these inputs change
 * within a session -- and guarded for non-browser contexts so the module stays
 * importable from the test runner.
 */
function detectConstrainedCanvas(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  if (/iPhone|iPod|Android/i.test(ua)) return true;

  // iPadOS 13+ masquerading as macOS.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;

  // Older iPads, and anything still sending a genuine iPad token.
  if (/iPad/i.test(ua)) return true;

  return false;
}

const isMobile = detectConstrainedCanvas();
export const MAX_IMAGE_DIMENSION = isMobile ? 4096 : 8192; // 4096 px on mobile / 8192 px on desktop
export const MAX_IMAGE_PIXELS = isMobile ? 16_777_216 : 67_108_864; // ~16.7 MP on mobile / ~67 MP on desktop
export const MAX_PAYLOAD_FILE_SIZE = 30 * 1024 * 1024; // 30 MB per payload file
export const MAX_TOTAL_PAYLOAD_SIZE = 50 * 1024 * 1024; // 50 MB total archive

/** Helper to read any File (PNG, JPG, WebP, BMP, ZIP) into image source & dimensions */
export async function readImageFile(file: File): Promise<{ src: string; w: number; h: number }> {
  if (file.size > MAX_CARRIER_FILE_SIZE) {
    throw new Error(`Carrier file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB safety limit.`);
  }

  const isZip = /\.zip$/i.test(file.name) || file.type.includes('zip');
  if (isZip) {
    try {
      const buf = await file.arrayBuffer();
      const extracted = parseZipArchive(new Uint8Array(buf));
      if (extracted) {
        const blob = new Blob([extracted as unknown as BlobPart], { type: 'image/png' });
        const subFile = new File([blob], file.name.replace(/\.zip$/i, '.png'), { type: 'image/png' });
        return readImageFile(subFile);
      }
    } catch {
      // fallback
    }
  }

  const isTiff = /\.tiff?$/i.test(file.name) || file.type.includes('tiff') || file.type.includes('tif');
  if (isTiff) {
    try {
      const buf = await file.arrayBuffer();
      const tiff = parseTiffToDataUrl(buf);
      if (tiff) {
        if (tiff.width > MAX_IMAGE_DIMENSION || tiff.height > MAX_IMAGE_DIMENSION || tiff.width * tiff.height > MAX_IMAGE_PIXELS) {
          throw new Error(`Image resolution (${tiff.width}x${tiff.height}) exceeds the ${isMobile ? 'mobile limit of 4096x4096 (16.7 MP)' : 'safety limit of 8192x8192 (67 MP)'}.`);
        }
        return { src: tiff.dataUrl, w: tiff.width, h: tiff.height };
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('limit')) throw err;
      // fallback
    }
  }

  const blobUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (w > MAX_IMAGE_DIMENSION || h > MAX_IMAGE_DIMENSION || w * h > MAX_IMAGE_PIXELS) {
        URL.revokeObjectURL(blobUrl);
        reject(new Error(`Image resolution (${w}x${h}) exceeds the ${isMobile ? 'mobile limit of 4096x4096 (16.7 MP)' : 'safety limit of 8192x8192 (67 MP)'}.`));
        return;
      }
      resolve({ src: blobUrl, w, h });
    };
    img.onerror = async () => {
      URL.revokeObjectURL(blobUrl);
      try {
        const buf = await file.arrayBuffer();
        const tiff = parseTiffToDataUrl(buf);
        if (tiff) {
          if (tiff.width > MAX_IMAGE_DIMENSION || tiff.height > MAX_IMAGE_DIMENSION || tiff.width * tiff.height > MAX_IMAGE_PIXELS) {
            return reject(new Error(`Image resolution (${tiff.width}x${tiff.height}) exceeds the ${isMobile ? 'mobile limit of 4096x4096 (16.7 MP)' : 'safety limit of 8192x8192 (67 MP)'}.`));
          }
          return resolve({ src: tiff.dataUrl, w: tiff.width, h: tiff.height });
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('safety limit')) return reject(err);
      }
      reject(new Error('Failed to load image file.'));
    };
    img.src = blobUrl;
  });
}

// ── Passphrase generator ──────────────────────────────────────────────────────

/** Words per generated passphrase. 8 x log2(256) = 64 bits. */
export const PASSPHRASE_WORD_COUNT = 8;

/**
 * 256 short, real, readable English words -- 8 bits of entropy each.
 *
 * Size and word count are the whole point. The previous list held 37 words and
 * drew four of them: log2(37^4) = 20.8 bits, behind a button labelled "Generate
 * High-Entropy Passphrase". That is exhaustible in seconds no matter how many
 * PBKDF2 iterations sit behind it, and the list ships in the client bundle
 * where any attacker can read it. 8 words from 256 gives 64 bits.
 */
const PASSPHRASE_WORDS: string[] = [
  'anchor', 'amber', 'arbor', 'apex', 'aspen', 'atlas', 'aurora', 'autumn',
  'basalt', 'beacon', 'birch', 'bison', 'blaze', 'bloom', 'bramble', 'bridge',
  'cabin', 'canyon', 'cedar', 'cinder', 'citrus', 'clover', 'cobalt', 'comet',
  'coral', 'cosmos', 'crater', 'crest', 'crimson', 'crystal', 'cyclone', 'dagger',
  'dawn', 'delta', 'desert', 'dune', 'dusk', 'ember', 'equinox', 'estuary',
  'falcon', 'fathom', 'fern', 'fjord', 'flint', 'forest', 'fossil', 'foxglove',
  'galaxy', 'garnet', 'geyser', 'glacier', 'granite', 'grove', 'gulf', 'harbor',
  'hazel', 'heron', 'hollow', 'horizon', 'indigo', 'island', 'ivory', 'jasper',
  'jungle', 'juniper', 'kelp', 'kestrel', 'lagoon', 'lantern', 'lattice', 'lichen',
  'lilac', 'lumen', 'lunar', 'lyric', 'magnet', 'maple', 'marble', 'meadow',
  'mesa', 'meteor', 'mint', 'mirage', 'monsoon', 'moss', 'nebula', 'nectar',
  'nickel', 'nimbus', 'oasis', 'obsidian', 'ochre', 'onyx', 'opal', 'orbit',
  'orchid', 'osprey', 'otter', 'oxide', 'pampas', 'peak', 'pebble', 'pewter',
  'pine', 'plume', 'pollen', 'prairie', 'prism', 'pulsar', 'quarry', 'quartz',
  'quill', 'rapids', 'raven', 'reef', 'ridge', 'rill', 'river', 'rune',
  'sable', 'saffron', 'sage', 'sandbar', 'sapphire', 'savanna', 'sequoia', 'shale',
  'shore', 'silver', 'slate', 'solstice', 'spruce', 'starling', 'steppe', 'stone',
  'summit', 'sundial', 'talon', 'tamarind', 'tempest', 'thicket', 'thistle', 'thorn',
  'tide', 'timber', 'topaz', 'torrent', 'tundra', 'turquoise', 'umber', 'valley',
  'velvet', 'verdant', 'vertex', 'vesper', 'violet', 'vireo', 'vista', 'walnut',
  'warbler', 'willow', 'wisp', 'zenith', 'acorn', 'alder', 'almond', 'antler',
  'anvil', 'arch', 'ardent', 'arid', 'ballast', 'bayou', 'bellow', 'betony',
  'bittern', 'bluff', 'bolder', 'borealis', 'bracken', 'breeze', 'brindle', 'brook',
  'burrow', 'cactus', 'cairn', 'caldera', 'camber', 'cascade', 'cavern', 'chalk',
  'cirrus', 'cliff', 'cormorant', 'cove', 'crag', 'cricket', 'cypress', 'dahlia',
  'damson', 'dapple', 'delve', 'dogwood', 'drift', 'eagle', 'echo', 'eddy',
  'elder', 'elm', 'emerald', 'estate', 'faience', 'fallow', 'feldspar', 'fescue',
  'fig', 'finch', 'firth', 'flax', 'fleece', 'flume', 'foliage', 'ford',
  'fresco', 'frost', 'gable', 'gale', 'gannet', 'gorse', 'gossamer', 'gravel',
  'grebe', 'gully', 'gypsum', 'halcyon', 'hamlet', 'harrier', 'heath', 'hemlock',
  'hickory', 'hoarfrost', 'hornbeam', 'husk', 'icicle', 'inlet', 'iris', 'jade',
  'jetty', 'kernel', 'kettle', 'knoll', 'lark', 'larch', 'laurel', 'ledger',
];

/** Entropy in bits of one generated passphrase. */
export const PASSPHRASE_BITS = Math.floor(PASSPHRASE_WORD_COUNT * Math.log2(PASSPHRASE_WORDS.length));

/**
 * Draw a word index uniformly from [0, range) using rejection sampling.
 * `n % range` would bias toward low indices whenever range does not divide 2^32.
 */
function uniformIndex(range: number): number {
  const limit = Math.floor(0x100000000 / range) * range;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % range;
  }
}

export function generatePassphrase(): string {
  const words: string[] = [];
  for (let i = 0; i < PASSPHRASE_WORD_COUNT; i++) {
    words.push(PASSPHRASE_WORDS[uniformIndex(PASSPHRASE_WORDS.length)]);
  }
  return words.join('-');
}

/** True when `pass` looks like output of generatePassphrase (or a Diceware phrase). */
function looksLikeWordPhrase(pass: string): boolean {
  const parts = pass.split(/[-\s]+/).filter(Boolean);
  return parts.length >= 3 && parts.every((w) => /^[a-z]{2,12}$/.test(w));
}

// ── Entropy estimation ────────────────────────────────────────────────────────
/**
 * Estimate passphrase entropy in bits.
 *
 * Word phrases are scored per word against the generator's list, not per
 * character against an alphabet. Scoring "anchor-cedar-fjord-lumen-quartz-tide"
 * as 36 lowercase characters reports about 169 bits for a secret that actually
 * carries 62 -- the character-class model only describes secrets drawn
 * character by character.
 */
export function calcEntropy(pass: string): number {
  if (!pass) return 0;

  if (looksLikeWordPhrase(pass)) {
    const wordCount = pass.split(/[-\s]+/).filter(Boolean).length;
    return wordCount * Math.log2(PASSPHRASE_WORDS.length);
  }

  let pool = 0;
  if (/[a-z]/.test(pass)) pool += 26;
  if (/[A-Z]/.test(pass)) pool += 26;
  if (/[0-9]/.test(pass)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pass)) pool += 33;
  return pool > 0 ? pass.length * Math.log2(pool) : 0;
}

// ── Microtask Yield Helper (keeps UI 60 FPS buttery smooth during heavy ops) ───
export function yieldMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ── Key derivation cache ──────────────────────────────────────────────────────
/**
 * Caches derived AES keys so a decode that probes several container layouts pays
 * the 600k-iteration PBKDF2 cost once per (passphrase, salt) pair.
 *
 * Entries are keyed by a digest of the passphrase and salt together with a
 * per-session random pepper, never by the passphrase itself. The previous key
 * was the template literal `${password}:${saltHex}`, which left every passphrase
 * typed during the session sitting in a live Map as plaintext -- readable from
 * any heap snapshot, crash dump or successful XSS -- while the surrounding code
 * called zeroFill on a throwaway copy of the same bytes.
 *
 * The pepper means the cache keys are meaningless outside this page session,
 * and the CryptoKey values are non-extractable, so the cache holds nothing that
 * can be turned back into a passphrase.
 */
const keyCache = new Map<string, CryptoKey>();
const KEY_CACHE_LIMIT = 20;

/** Random per-session value mixed into cache keys. Never persisted. */
const cachePepper = crypto.getRandomValues(new Uint8Array(16));

async function keyCacheId(password: string, salt: Uint8Array): Promise<string> {
  const pwBytes = enc.encode(password);
  const material = new Uint8Array(cachePepper.length + salt.length + pwBytes.length);
  material.set(cachePepper, 0);
  material.set(salt, cachePepper.length);
  material.set(pwBytes, cachePepper.length + salt.length);
  try {
    return await calcSha256(material);
  } finally {
    zeroFill(material);
    zeroFill(pwBytes);
  }
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  if (typeof crypto === 'undefined' || !crypto?.subtle) {
    throw new Error('Web Crypto is unavailable on this origin. Connect over HTTPS or localhost to enable authenticated encryption.');
  }

  const cacheKey = await keyCacheId(password, salt);
  const cached = keyCache.get(cacheKey);
  if (cached) return cached;

  const saltBuf = salt.byteOffset === 0 && salt.byteLength === salt.buffer.byteLength
    ? salt.buffer
    : salt.slice().buffer;

  const pwBytes = enc.encode(password);
  try {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      pwBytes as BufferSource,
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBuf as ArrayBuffer, iterations: 600_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable: the raw key never becomes readable to script
      ['encrypt', 'decrypt'],
    );
    if (keyCache.size >= KEY_CACHE_LIMIT) keyCache.clear();
    keyCache.set(cacheKey, key);
    return key;
  } finally {
    zeroFill(pwBytes);
  }
}

/** Drop every cached key. Called when the user clears the session. */
export function clearKeyCache(): void {
  keyCache.clear();
}

// ── AES-GCM-256 ───────────────────────────────────────────────────────────────
// Wire: [salt:16][iv:12][ciphertext+tag]. Exported as encryptPayload /
// decryptPayload so the self-tests exercise the same code the app uses, rather
// than a re-implementation that can pass while the real path is broken.
async function aesEncrypt(data: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  try {
    const key = await deriveKey(password, salt);
    const ct  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data as BufferSource);
    
    // Wire: [salt:16][iv:12][ciphertext+tag]
    const out = new Uint8Array(16 + 12 + ct.byteLength);
    out.set(salt, 0);
    out.set(iv, 16);
    out.set(new Uint8Array(ct), 28);
    return out;
  } finally {
    zeroFill(salt);
    zeroFill(iv);
  }
}

// ── AES-GCM-256 Decrypt with Zero-Fill Memory Cleansing ──────────────────────
async function aesDecrypt(data: Uint8Array, password: string): Promise<Uint8Array> {
  if (data.length < 28) {
    throw new Error('Ciphertext is too short to contain authentication tag.');
  }
  const salt = new Uint8Array(data.subarray(0, 16));
  const iv   = new Uint8Array(data.subarray(16, 28));
  const ct   = new Uint8Array(data.subarray(28));
  try {
    const key = await deriveKey(password, salt);
    const pt  = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct as BufferSource);
    return new Uint8Array(pt as ArrayBuffer);
  } finally {
    zeroFill(salt);
    zeroFill(iv);
    zeroFill(ct);
  }
}

/** Bytes AES-GCM adds to a payload: 16 salt + 12 IV + 16 authentication tag. */
export const AES_OVERHEAD_BYTES = 44;

/** Seal a payload under a passphrase. Wire: [salt:16][iv:12][ct+tag]. */
export const encryptPayload = aesEncrypt;

/** Open a payload sealed by encryptPayload. Throws if the tag does not verify. */
export const decryptPayload = aesDecrypt;

// ── uint32 little-endian ──────────────────────────────────────────────────────
function u32LE(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
}

function readU32LE(buf: Uint8Array, off = 0): number {
  return (buf[off] | (buf[off+1] << 8) | (buf[off+2] << 16) | (buf[off+3] << 24)) >>> 0;
}

// ── Load image → canvas (Fast createImageBitmap path) ─────────────────────────
function loadCanvasImg(src: string, maxDim?: number): Promise<{ ctx: CanvasRenderingContext2D; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (maxDim && (w > maxDim || h > maxDim)) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ ctx, w, h });
    };
    img.onerror = async () => {
      try {
        const resp = await fetch(src);
        const buf = await resp.arrayBuffer();
        const tiff = parseTiffToDataUrl(buf);
        if (tiff) {
          const tiffImg = new Image();
          tiffImg.onload = () => {
            let w = tiff.width;
            let h = tiff.height;
            if (maxDim && (w > maxDim || h > maxDim)) {
              const ratio = Math.min(maxDim / w, maxDim / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
            ctx.drawImage(tiffImg, 0, 0, w, h);
            resolve({ ctx, w, h });
          };
          tiffImg.src = tiff.dataUrl;
          return;
        }
      } catch {
        // ignore
      }
      reject(new Error('Failed to process image buffer on canvas. Please select a valid PNG, JPG, WebP, or BMP image.'));
    };
    img.src = src;
  });
}

function loadCanvas(src: string, maxDim?: number): Promise<{ ctx: CanvasRenderingContext2D; w: number; h: number }> {
  if (typeof createImageBitmap !== 'undefined' && src.startsWith('blob:')) {
    return (async () => {
      try {
        const resp = await fetch(src);
        const blob = await resp.blob();
        const bmp = await createImageBitmap(blob);
        let w = bmp.width;
        let h = bmp.height;

        if (maxDim && (w > maxDim || h > maxDim)) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(bmp, 0, 0, w, h);
        bmp.close();
        return { ctx, w, h };
      } catch {
        // fallback to standard image loader
      }
      return loadCanvasImg(src, maxDim);
    })();
  }
  return loadCanvasImg(src, maxDim);
}

// ── Capacity (bytes) for a given image resolution & density mode ──────────────
export function calculateCapacity(w: number, h: number, density: CapacityDensity = DEFAULT_D): number {
  const bitsPerChannel = BITS[density] ?? BITS[DEFAULT_D];
  return Math.max(0, Math.floor((w * h * 3 * bitsPerChannel - 32) / 8));
}

export async function getCarrierCapacity(file: File | string, density: CapacityDensity = DEFAULT_D): Promise<number> {
  const src = typeof file === 'string' ? file : URL.createObjectURL(file);
  const { w, h } = await loadCanvas(src);
  if (typeof file !== 'string') URL.revokeObjectURL(src);
  return calculateCapacity(w, h, density);
}

// ── GhostVault multi-file framing (with Filename Sanitization) ────────────────
export function buildGhostVault(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const parts: Uint8Array[] = [GHOST_VAULT_SIG, u32LE(files.length)];
  for (const f of files) {
    const safeName = sanitizeFilename(f.name);
    const nameBytes = enc.encode(safeName);
    parts.push(u32LE(nameBytes.length), nameBytes, u32LE(f.data.length), f.data);
  }
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

export const packMultipleFiles = buildGhostVault;

// ── GhostFile single-file framing (with Filename Sanitization) ────────────────
export function buildGhostFile(name: string, data: Uint8Array): Uint8Array {
  const safeName = sanitizeFilename(name);
  const nameBytes = enc.encode(safeName);
  const out = new Uint8Array(10 + 4 + nameBytes.length + 4 + data.length);
  let off = 0;
  out.set(GHOST_FILE_SIG, off); off += 10;
  out.set(u32LE(nameBytes.length), off); off += 4;
  out.set(nameBytes, off); off += nameBytes.length;
  out.set(u32LE(data.length), off); off += 4;
  out.set(data, off);
  return out;
}

// ── Encode (main) ────────────────────────────────────────────────────────────
export type ProgressCallback = (percent: number, status: string) => void;

/** crypto.getRandomValues caps at 65536 bytes per call; fill larger buffers in slices. */
export function fillRandom(buf: Uint8Array): void {
  for (let i = 0; i < buf.length; i += 65536) {
    crypto.getRandomValues(asRandomTarget(buf.subarray(i, Math.min(i + 65536, buf.length))));
  }
}

export async function encodeImage(
  carrierSrc: string,
  payload: Uint8Array | string,
  password?: string,
  density: CapacityDensity = DEFAULT_D,
  maxDimension: number = 0,
  onProgress?: ProgressCallback,
): Promise<string> {
  const rawPayload = typeof payload === 'string' ? enc.encode(payload) : payload;
  let data = rawPayload;
  let stream: Uint8Array | null = null;

  try {
    if (password && password.length > 0) {
      onProgress?.(15, 'Deriving authenticated cryptographic keys...');
      data = await aesEncrypt(rawPayload, password);
    }
    await yieldMainThread();

    onProgress?.(35, 'Preparing carrier canvas & scrubbing metadata...');
    const { ctx, w, h } = await loadCanvas(carrierSrc, maxDimension > 0 ? maxDimension : undefined);
    const cap = calculateCapacity(w, h, density);
    if (data.length > cap) {
      throw new Error(`Payload (${data.length.toLocaleString()} B) exceeds carrier capacity (${cap.toLocaleString()} B)`);
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    const px = imgData.data;
    await yieldMainThread();

    onProgress?.(60, 'Embedding bitstream into RGB channels...');
    stream = new Uint8Array(4 + data.length);
    stream.set(u32LE(data.length), 0);
    stream.set(data, 4);

    // Offload pixel bitstream injection to a Web Worker to keep the UI responsive.
    const modifiedPx = await processPixelsWithWorker(px, stream, density);

    onProgress?.(85, 'Rendering lossless steganographic container...');
    await yieldMainThread();
    ctx.putImageData(new ImageData(asImageBytes(modifiedPx), w, h), 0, 0);

    return await new Promise<string>((resolve, reject) => {
      (ctx.canvas as HTMLCanvasElement).toBlob(
        (blob) => {
          // toBlob yields null when the canvas is tainted or allocation fails.
          // Rejecting here matters: throwing inside the callback would leave
          // this promise permanently unsettled and hang the encode button.
          if (!blob) {
            reject(new Error('The browser could not render the stego image. The carrier may be too large for available memory.'));
            return;
          }
          onProgress?.(100, 'Encoding complete!');
          resolve(URL.createObjectURL(blob));
        },
        'image/png',
      );
    });
  } finally {
    zeroFill(stream);
    // `data` is the ciphertext when a password was used; the caller still owns
    // the plaintext payload, so that one is left alone.
    if (data !== rawPayload) zeroFill(data);
  }
}

// ── Deniable dual-vault ──────────────────────────────────────────────────────

/** salt(16) + iv(12) + length prefix(4) + GCM tag(16) */
export const DUAL_VAULT_BLOCK_OVERHEAD = 48;

/** Largest payload each half of a dual-vault container can hold. */
export function dualVaultCapacity(totalCapacity: number): number {
  const split = Math.floor(totalCapacity / 2);
  return Math.max(0, Math.min(split, totalCapacity - split) - DUAL_VAULT_BLOCK_OVERHEAD);
}

/** Encrypt `payload` so the sealed block occupies exactly `blockSize` bytes. */
async function buildVaultBlock(
  payload: Uint8Array,
  password: string,
  blockSize: number,
): Promise<Uint8Array> {
  const innerLen = blockSize - 16 - 12 - 16; // minus salt, iv, GCM tag
  if (innerLen < 4 + payload.length) {
    throw new Error('Vault payload does not fit its half of the carrier.');
  }
  const inner = new Uint8Array(innerLen);
  fillRandom(inner); // slack after the payload stays random
  inner.set(u32LE(payload.length), 0);
  inner.set(payload, 4);
  try {
    const block = await aesEncrypt(inner, password);
    if (block.length !== blockSize) {
      throw new Error(`Vault block size mismatch (${block.length} != ${blockSize}).`);
    }
    return block;
  } finally {
    zeroFill(inner);
  }
}

/**
 * Write two independently-encrypted vaults into one carrier, so that revealing
 * the decoy passphrase under coercion discloses a plausible payload while the
 * real one stays sealed and undetectable.
 *
 * Layout, where split = floor(capacity / 2):
 *
 *   [0, split)         decoy block     [salt:16][iv:12][ct+tag]
 *   [split, capacity)  primary block   [salt:16][iv:12][ct+tag]
 *
 * Each block's plaintext is [len:4][payload][random padding], sized so its
 * ciphertext fills its half exactly. There are no magic bytes, no plaintext
 * length fields and no offset table inside the container: without one of the
 * two passphrases every byte is indistinguishable from random.
 *
 * The fixed halves are what make this recoverable at all. AES-GCM must be given
 * the exact ciphertext extent to verify its tag, so the decoder has to know
 * where each block ends without being told. The previous scheme put the primary
 * block at a payload-dependent tail offset and then guessed among sixteen
 * hard-coded lengths to find it again, which left all but fifteen exact payload
 * sizes permanently unrecoverable.
 *
 * Known limitation: the outer container header records a payload length equal
 * to the carrier's full capacity, so an adversary who knows this tool can tell
 * that a dual vault is present. What stays hidden is whether the second half
 * holds anything, and what it holds.
 */
export async function sealDualVault(
  primaryPayload: Uint8Array | string,
  primaryPassword: string,
  decoyPayload: Uint8Array | string,
  decoyPassword: string,
  totalCapacity: number,
  onProgress?: ProgressCallback,
): Promise<Uint8Array> {
  if (!primaryPassword || !decoyPassword) {
    throw new Error('A dual vault needs both a real passphrase and a separate decoy passphrase.');
  }
  if (primaryPassword === decoyPassword) {
    throw new Error('The decoy passphrase must differ from the real one, or the decoy gives no cover.');
  }

  const split = Math.floor(totalCapacity / 2);
  const rawPrimary = typeof primaryPayload === 'string' ? enc.encode(primaryPayload) : primaryPayload;
  const rawDecoy = typeof decoyPayload === 'string' ? enc.encode(decoyPayload) : decoyPayload;

  const perVault = dualVaultCapacity(totalCapacity);
  const largest = Math.max(rawPrimary.length, rawDecoy.length);
  if (largest > perVault) {
    throw new Error(
      `Each vault holds up to ${perVault.toLocaleString()} B in this carrier; the larger payload is ${largest.toLocaleString()} B. Use a larger image or a higher density.`
    );
  }

  onProgress?.(30, 'Sealing decoy vault...');
  const decoyBlock = await buildVaultBlock(rawDecoy, decoyPassword, split);

  onProgress?.(55, 'Sealing hidden vault...');
  const primaryBlock = await buildVaultBlock(rawPrimary, primaryPassword, totalCapacity - split);

  const container = new Uint8Array(totalCapacity);
  container.set(decoyBlock, 0);
  container.set(primaryBlock, split);

  zeroFill(decoyBlock);
  zeroFill(primaryBlock);
  return container;
}

/** Seal a dual vault and embed it in a carrier image. */
export async function encodeHoneyVault(
  carrierSrc: string,
  primaryPayload: Uint8Array | string,
  primaryPassword: string,
  decoyPayload: Uint8Array | string,
  decoyPassword: string,
  density: CapacityDensity = DEFAULT_D,
  maxDimension: number = 0,
  onProgress?: ProgressCallback,
): Promise<string> {
  onProgress?.(10, 'Measuring carrier capacity...');
  const { w, h } = await loadCanvas(carrierSrc, maxDimension > 0 ? maxDimension : undefined);
  const totalCap = calculateCapacity(w, h, density);

  const container = await sealDualVault(
    primaryPayload, primaryPassword, decoyPayload, decoyPassword, totalCap, onProgress,
  );

  try {
    onProgress?.(75, 'Embedding uniform-entropy container...');
    // No password here: the container is already two layers of AES-GCM and has
    // to reach the pixels byte for byte.
    return await encodeImage(carrierSrc, container, undefined, density, maxDimension, onProgress);
  } finally {
    zeroFill(container);
  }
}

// ── Decode result types ───────────────────────────────────────────────────────
export interface EmbeddedFile {
  name: string;
  data: Uint8Array;
  size?: number;
}

export type DecodeResult =
  | { type: 'text';   content: string; rawBytes?: Uint8Array; isDecoy?: boolean; isAsymmetric?: boolean }
  | { type: 'file';   name: string; data: Uint8Array; isDecoy?: boolean; isAsymmetric?: boolean }
  | { type: 'vault';  files: EmbeddedFile[]; isDecoy?: boolean; isAsymmetric?: boolean }
  | { type: 'binary'; data: Uint8Array; isDecoy?: boolean; isAsymmetric?: boolean };

/** Marks an error as "the bitstream parsed, the passphrase did not fit". */
interface DecryptError extends Error { isDecryptFailure?: true }

function decryptFailure(message: string): DecryptError {
  const err: DecryptError = new Error(message);
  err.isDecryptFailure = true;
  return err;
}

/**
 * Unlock an extracted container with a passphrase, trying each layout the
 * encoder can produce.
 *
 *  1. Single vault -- the whole buffer is one AES-GCM block whose plaintext is
 *     the payload itself.
 *  2. Dual vault -- two fixed halves, decoy in the first, primary in the
 *     second, each with a [len:4][payload][padding] plaintext.
 *
 * Every branch is a real AES-GCM tag check, so a wrong passphrase cannot be
 * mistaken for a right one, and the caller is told which half opened.
 */
export async function openContainer(
  raw: Uint8Array,
  password: string,
  onProgress?: ProgressCallback,
  abortSignal?: AbortSignal,
): Promise<DecodeResult> {
  if (abortSignal?.aborted) throw new Error('Decryption cancelled by user.');

  // 1. Single vault.
  onProgress?.(65, 'Authenticating standard container (PBKDF2 600k)...');
  await yieldMainThread();
  try {
    const pt = await aesDecrypt(raw, password);
    return unpackPayload(pt);
  } catch {
    // Not a single vault, or not this passphrase. Fall through.
  }

  if (abortSignal?.aborted) throw new Error('Decryption cancelled by user.');

  // 2. Dual vault, fixed halves.
  const split = Math.floor(raw.length / 2);
  if (split > DUAL_VAULT_BLOCK_OVERHEAD) {
    onProgress?.(78, 'Probing dual-vault decoy and hidden blocks (PBKDF2 600k)...');
    await yieldMainThread();
    const halves: { block: Uint8Array; isDecoy: boolean }[] = [
      { block: raw.subarray(0, split), isDecoy: true },
      { block: raw.subarray(split), isDecoy: false },
    ];

    for (const { block, isDecoy } of halves) {
      if (abortSignal?.aborted) throw new Error('Decryption cancelled by user.');
      let inner: Uint8Array | null = null;
      try {
        inner = await aesDecrypt(block, password);
      } catch {
        continue; // this passphrase does not open this half
      }
      try {
        if (inner.length < 4) continue;
        const declared = readU32LE(inner, 0);
        if (declared > inner.length - 4) continue;
        const result = unpackPayload(new Uint8Array(inner.subarray(4, 4 + declared)));
        result.isDecoy = isDecoy;
        return result;
      } finally {
        zeroFill(inner);
      }
    }
  }

  throw decryptFailure('Incorrect passphrase, or this carrier holds no QuietSend payload.');
}

/**
 * Read a bitstream out of the pixel buffer at one density and interpret it.
 * Uses Web Worker to perform LSB extraction off the main thread.
 */
async function tryDecodeDensity(
  px: Uint8ClampedArray,
  totalRgbChannels: number,
  density: CapacityDensity,
  password?: string,
  onProgress?: ProgressCallback,
  abortSignal?: AbortSignal,
): Promise<DecodeResult> {
  if (abortSignal?.aborted) throw new Error('Extraction cancelled by user.');
  
  const rawData = await extractBitsWithWorker(px, totalRgbChannels, density);
  if (!rawData) {
    throw new Error(`No valid ${density.toUpperCase()} payload detected`);
  }

  // Legacy GHOST_HONEY dual container, written before the fixed-halves layout.
  if (rawData.length >= 19 && constantTimeCompare(rawData.subarray(0, 11), GHOST_HONEY_SIG)) {
    onProgress?.(50, 'Analyzing legacy Honey-Vault container...');
    await yieldMainThread();
    let off = 11;
    const decoyLen = readU32LE(rawData, off); off += 4;
    if (off + decoyLen <= rawData.length) {
      const decoyCipher = rawData.subarray(off, off + decoyLen); off += decoyLen;
      if (off + 4 <= rawData.length) {
        const primaryLen = readU32LE(rawData, off); off += 4;
        if (off + primaryLen <= rawData.length && password && password.length > 0) {
          const primaryCipher = rawData.subarray(off, off + primaryLen);
          try {
            const pt = await aesDecrypt(decoyCipher, password);
            const res = unpackPayload(pt);
            res.isDecoy = true;
            return res;
          } catch {
            // decoy did not open; try the primary block
          }
          try {
            return unpackPayload(await aesDecrypt(primaryCipher, password));
          } catch {
            throw decryptFailure('Incorrect passphrase for this Honey-Vault container.');
          }
        }
      }
    }
  }

  // Asymmetric envelope: the "password" is a PKCS#8 private key.
  if (isAsymmetricPayload(rawData)) {
    if (!password || password.length === 0) {
      throw new Error('This payload is encrypted to a public key. Unlock it with the matching private key from your Keyring.');
    }
    onProgress?.(65, 'Decrypting with asymmetric private key...');
    await yieldMainThread();
    try {
      const res = unpackPayload(await decryptWithPrivateKey(rawData, password));
      res.isAsymmetric = true;
      return res;
    } catch (e) {
      throw decryptFailure(e instanceof Error ? e.message : 'Private key could not open this payload.');
    }
  }

  if (password && password.length > 0) {
    return await openContainer(rawData, password, onProgress, abortSignal);
  }

  return unpackPayload(rawData);
}

// ── Decode (main) — probes each density in turn ───────────────────────────────
export async function decodeImage(
  stegoSrc: string,
  password?: string,
  onProgress?: ProgressCallback,
  abortSignal?: AbortSignal,
): Promise<DecodeResult> {
  onProgress?.(15, 'Loading carrier pixel matrix...');
  await yieldMainThread();
  const { ctx, w, h } = await loadCanvas(stegoSrc);
  const px = ctx.getImageData(0, 0, w, h).data;
  const totalRgbChannels = Math.floor((px.length / 4) * 3);

  onProgress?.(35, 'Detecting steganographic bitstream density...');
  await yieldMainThread();

  let firstBinary: DecodeResult | null = null;
  let bestError: unknown = null;

  for (const density of PROBE_ORDER) {
    if (abortSignal?.aborted) throw new Error('Extraction cancelled by user.');
    await yieldMainThread();
    try {
      const res = await tryDecodeDensity(px, totalRgbChannels, density, password, onProgress, abortSignal);
      // A binary result means the bits came out but nothing recognised them, so
      // keep probing: a later density may produce a real payload.
      if (res.type !== 'binary') {
        onProgress?.(100, 'Payload extracted successfully!');
        return res;
      }
      firstBinary ??= res;
    } catch (e) {
      if (abortSignal?.aborted) throw e;
      // A decrypt failure is far more informative than "no payload at this
      // density", so let it win when we have to report something.
      if (!bestError || (e as DecryptError)?.isDecryptFailure) bestError = e;
    }
  }

  if (firstBinary) {
    onProgress?.(100, 'Payload extracted successfully!');
    return firstBinary;
  }

  throw bestError ?? new Error('No valid steganographic payload detected.');
}

// ── Unpack Payload with Fuzz-Proof Strict Bounds Checking ─────────────────────
export function unpackPayload(data: Uint8Array): DecodeResult {
  if (!data || data.length === 0) {
    return { type: 'text', content: '', rawBytes: new Uint8Array(0) };
  }

  // ── Parse GhostVault (Constant-Time Signature Check & Strict Bound Bounds)
  if (data.length >= 15 && constantTimeCompare(data.subarray(0, 11), GHOST_VAULT_SIG)) {
    const rawFileCount = readU32LE(data, 11);
    // Security bounds: Ensure fileCount cannot exceed remaining byte capacity or 500 items
    const maxPossibleFiles = Math.floor((data.length - 15) / 8);
    const fileCount = Math.min(rawFileCount, maxPossibleFiles, 500);

    const files: EmbeddedFile[] = [];
    let off = 15;
    for (let i = 0; i < fileCount; i++) {
      if (off + 4 > data.length) break;
      const nameLen = readU32LE(data, off); off += 4;
      if (nameLen === 0 || nameLen > 512 || off + nameLen > data.length) break;
      const rawName = dec.decode(data.subarray(off, off + nameLen)); off += nameLen;
      if (off + 4 > data.length) break;
      const dataLen = readU32LE(data, off); off += 4;
      if (dataLen > data.length - off) break; // Strict overflow protection
      const fileData = data.subarray(off, off + dataLen);
      
      files.push({
        name: sanitizeFilename(rawName),
        data: fileData,
        size: fileData.length,
      });
      off += dataLen;
    }

    if (files.length > 0) {
      return { type: 'vault', files };
    }
  }

  // ── Parse GhostFile (Constant-Time Signature Check & Strict Bounds)
  if (data.length >= 18 && constantTimeCompare(data.subarray(0, 10), GHOST_FILE_SIG)) {
    let off = 10;
    const nameLen = readU32LE(data, off); off += 4;
    if (nameLen > 0 && nameLen <= 512 && off + nameLen <= data.length) {
      const rawName = dec.decode(data.subarray(off, off + nameLen)); off += nameLen;
      if (off + 4 <= data.length) {
        const dataLen = readU32LE(data, off); off += 4;
        if (dataLen <= data.length - off) {
          return {
            type: 'file',
            name: sanitizeFilename(rawName),
            data: data.subarray(off, off + dataLen),
          };
        }
      }
    }
  }

  // ── UTF-8 text fallback
  try {
    const text = dec.decode(data);
    if ((text.match(/\uFFFD/g) || []).length < text.length * 0.05 && text.length > 0) {
      return { type: 'text', content: text, rawBytes: data };
    }
  } catch { /* fall through */ }

  return { type: 'binary', data };
}

// ── MSE / PSNR / Heatmap ─────────────────────────────────────────────────────
export async function compareImages(origSrc: string, modSrc: string) {
  const [a, b] = await Promise.all([loadCanvas(origSrc, 1920), loadCanvas(modSrc, 1920)]);
  const w = Math.min(a.w, b.w);
  const h = Math.min(a.h, b.h);
  const ad = a.ctx.getImageData(0, 0, w, h).data;
  const bd = b.ctx.getImageData(0, 0, w, h).data;

  let mseSum = 0;
  const heat = new Uint8ClampedArray(w * h * 4);
  const len = ad.length;

  for (let i = 0; i < len; i += 4) {
    const dr = ad[i] - bd[i];
    const dg = ad[i + 1] - bd[i + 1];
    const db = ad[i + 2] - bd[i + 2];
    const absDr = dr < 0 ? -dr : dr;
    const absDg = dg < 0 ? -dg : dg;
    const absDb = db < 0 ? -db : db;
    const diffSum = absDr + absDg + absDb;
    mseSum += (dr * dr) + (dg * dg) + (db * db);

    const amp = Math.min(255, (diffSum * 16) / 3);
    heat[i]     = amp;
    heat[i + 1] = Math.max(0, 255 - amp);
    heat[i + 2] = 0;
    heat[i + 3] = 255;
  }

  const mse = mseSum / (w * h * 3);
  const psnr = mse === 0 ? 100 : 10 * Math.log10((255 * 255) / mse);

  const heatCanvas = document.createElement('canvas');
  heatCanvas.width = w;
  heatCanvas.height = h;
  const heatCtx = heatCanvas.getContext('2d')!;
  heatCtx.putImageData(new ImageData(heat, w, h), 0, 0);

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = w;
  diffCanvas.height = h;
  const diffCtx = diffCanvas.getContext('2d')!;
  diffCtx.drawImage(b.ctx.canvas, 0, 0);

  const [heatmapUrl, diffUrl] = await Promise.all([
    new Promise<string>((resolve) => {
      heatCanvas.toBlob((blob) => resolve(URL.createObjectURL(blob!)), 'image/png');
    }),
    new Promise<string>((resolve) => {
      diffCanvas.toBlob((blob) => resolve(URL.createObjectURL(blob!)), 'image/png');
    }),
  ]);

  return {
    mse,
    psnr,
    diffUrl,
    heatmapUrl,
  };
}

// ── Bit-plane extraction (0 = LSB, 7 = MSB) (Accelerated 32-bit Processing) ───
export async function getBitPlane(src: string, bit: number): Promise<string> {
  const { ctx, w, h } = await loadCanvas(src, 1920);
  const imgData = ctx.getImageData(0, 0, w, h);
  const px = imgData.data;

  const mask = 1 << Math.max(0, Math.min(7, bit));
  const buf32 = new Uint32Array(px.buffer);
  const len = buf32.length;
  for (let i = 0; i < len; i++) {
    const p = buf32[i];
    const r = (p & mask) ? 255 : 0;
    const g = ((p >> 8) & mask) ? 255 : 0;
    const b = ((p >> 16) & mask) ? 255 : 0;
    buf32[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }

  ctx.putImageData(imgData, 0, 0);
  return new Promise<string>((resolve) => {
    (ctx.canvas as HTMLCanvasElement).toBlob(
      (blob) => resolve(URL.createObjectURL(blob!)),
      'image/png',
    );
  });
}

// ── Utility: Trigger direct browser download (with Filename Sanitization) ─────
export function downloadBlob(data: Uint8Array, filename: string): void {
  const safeName = sanitizeFilename(filename);
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadZip(pngBlobUrl: string, zipFilename: string): Promise<void> {
  const res = await fetch(pngBlobUrl);
  const buf = await res.arrayBuffer();
  const pngBytes = new Uint8Array(buf);
  const zipBytes = buildZipArchive('quietsend-document.png', pngBytes);
  downloadBlob(zipBytes, zipFilename);
}
