import UTIF from 'utif';
import { processPixelsWithWorker } from './workerClient';
import { isAsymmetricPayload, decryptWithPrivateKey } from './asymmetricCrypto';

const enc = new TextEncoder();
const dec = new TextDecoder();

const GHOST_VAULT_SIG = enc.encode('GHOST_VAULT'); // 11 bytes
const GHOST_FILE_SIG  = enc.encode('GHOST_FILE');  // 10 bytes
const GHOST_HONEY_SIG = enc.encode('GHOST_HONEY'); // 11 bytes

export type CapacityDensity = 'lsb4' | 'lsb6';

/** Constant-time byte buffer comparison to prevent timing side-channel attacks */
export function constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/** Pure JS fallback for SHA-256 (handles mobile browsers accessing over local HTTP) */
function jsSha256(bytes: Uint8Array): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = bytes.length * 8;

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (i = 0; i < bytes.length; i++) {
    words[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    while (w.length < 64) {
      const idx = w.length;
      const gamma0 = rightRotate(w[idx - 15], 7) ^ rightRotate(w[idx - 15], 18) ^ (w[idx - 15] >>> 3);
      const gamma1 = rightRotate(w[idx - 2], 17) ^ rightRotate(w[idx - 2], 19) ^ (w[idx - 2] >>> 10);
      w.push((w[idx - 16] + gamma0 + w[idx - 7] + gamma1) | 0);
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (j = 0; j < 64; j++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + (w[j] || 0)) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
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

  const nameLen = view.getUint16(26, true);
  const extraLen = view.getUint16(28, true);
  const compLen = view.getUint32(18, true);

  const dataStart = 30 + nameLen + extraLen;
  if (dataStart + compLen > buf.length) return null;

  return buf.subarray(dataStart, dataStart + compLen);
}

/** Helper: Calculate dimension scaling */
export function getScaledDimensions(w: number, h: number, maxDim: number): { w: number; h: number } {
  if (maxDim <= 0 || (w <= maxDim && h <= maxDim)) return { w, h };
  const ratio = Math.min(maxDim / w, maxDim / h);
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
}

/** Helper to read any File (PNG, JPG, WebP, BMP, ZIP) into image source & dimensions */
export async function readImageFile(file: File): Promise<{ src: string; w: number; h: number }> {
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
        return { src: tiff.dataUrl, w: tiff.width, h: tiff.height };
      }
    } catch {
      // fallback
    }
  }

  const blobUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      resolve({ src: blobUrl, w, h });
    };
    img.onerror = async () => {
      URL.revokeObjectURL(blobUrl);
      try {
        const buf = await file.arrayBuffer();
        const tiff = parseTiffToDataUrl(buf);
        if (tiff) {
          return resolve({ src: tiff.dataUrl, w: tiff.width, h: tiff.height });
        }
      } catch {
        // ignore
      }
      reject(new Error('Failed to load image file.'));
    };
    img.src = blobUrl;
  });
}

// ── Passphrase generator (Cryptographically Secure via Web Crypto) ────────────
export function generatePassphrase(): string {
  const words = [
    'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
    'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey',
    'xray', 'yankee', 'zulu', 'cyber', 'ghost', 'quiet', 'stealth', 'cipher',
    'vector', 'matrix', 'nexus', 'prism', 'quantum', 'shadow', 'vortex',
  ];
  const r = new Uint32Array(4);
  crypto.getRandomValues(r);
  return Array.from(r).map((n) => words[n % words.length]).join('-');
}

// ── Entropy calculation ───────────────────────────────────────────────────────
export function calcEntropy(pass: string): number {
  if (!pass) return 0;
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

// ── Key derivation cache for ultra-fast multi-pass decryption ──────────────
const keyCache = new Map<string, CryptoKey>();

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  if (typeof crypto === 'undefined' || !crypto?.subtle) {
    throw new Error('Web Crypto API is disabled by your mobile browser over unencrypted HTTP. Please connect via HTTPS or localhost to enable authenticated encryption.');
  }
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
  const cacheKey = `${password}:${saltHex}`;
  let cached = keyCache.get(cacheKey);
  if (cached) return cached;

  const saltBuf = salt.byteOffset === 0 && salt.byteLength === salt.buffer.byteLength
    ? salt.buffer
    : salt.slice().buffer;

  const pwBytes = enc.encode(password);
  try {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      pwBytes,
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBuf as ArrayBuffer, iterations: 600_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    if (keyCache.size > 20) keyCache.clear();
    keyCache.set(cacheKey, key);
    return key;
  } finally {
    zeroFill(pwBytes);
  }
}

// ── AES-GCM-256 Encrypt with Zero-Fill Memory Cleansing ──────────────────────
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

// ── Nibble helpers (LSB4 - 4 bits per RGB channel) ───────────────────────────
function bytesToNibbles(bytes: Uint8Array): Uint8Array {
  const nibbles = new Uint8Array(bytes.length * 2);
  for (let i = 0; i < bytes.length; i++) {
    nibbles[i * 2]     = (bytes[i] >> 4) & 0x0f;
    nibbles[i * 2 + 1] = bytes[i] & 0x0f;
  }
  return nibbles;
}

function nibblesToBytes(nibbles: Uint8Array | number[]): Uint8Array {
  const len = Math.floor(nibbles.length / 2);
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = ((nibbles[i * 2] & 0x0f) << 4) | (nibbles[i * 2 + 1] & 0x0f);
  }
  return bytes;
}

// ── 6-Bit Chunk Helpers (LSB6 - 6 bits per RGB channel) ───────────────────────
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

function sixBitChunksToBytes(chunks: Uint8Array | number[], byteCount: number): Uint8Array {
  const bytes = new Uint8Array(byteCount);
  const totalBits = byteCount * 8;
  let bitPos = 0;
  for (let i = 0; i < chunks.length && bitPos < totalBits; i++) {
    const chunkVal = chunks[i] & 0x3f;
    for (let b = 0; b < 6 && bitPos < totalBits; b++) {
      const bitVal = (chunkVal >> (5 - b)) & 1;
      const byteIdx = bitPos >> 3;
      const bitInByte = 7 - (bitPos & 7);
      bytes[byteIdx] |= (bitVal << bitInByte);
      bitPos++;
    }
  }
  return bytes;
}

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
export function calculateCapacity(w: number, h: number, density: CapacityDensity = 'lsb6'): number {
  const bitsPerChannel = density === 'lsb6' ? 6 : 4;
  return Math.max(0, Math.floor((w * h * 3 * bitsPerChannel - 32) / 8));
}

export async function getCarrierCapacity(file: File | string, density: CapacityDensity = 'lsb6'): Promise<number> {
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

// ── Encode (main) supporting LSB-4 (Stealth) and LSB-6 (Max Capacity) ─────────
export type ProgressCallback = (percent: number, status: string) => void;

export async function encodeImage(
  carrierSrc: string,
  payload: Uint8Array | string,
  password?: string,
  density: CapacityDensity = 'lsb6',
  maxDimension: number = 0,
  onProgress?: ProgressCallback,
): Promise<string> {
  let rawPayload = typeof payload === 'string' ? enc.encode(payload) : payload;
  let data = rawPayload;
  let stream: Uint8Array | null = null;
  let chunks6: Uint8Array | null = null;
  let nibbles: Uint8Array | null = null;

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

    // Offload pixel bitstream injection to Web Worker for 60 FPS responsiveness
    const modifiedPx = await processPixelsWithWorker(px, stream, density);

    onProgress?.(85, 'Rendering lossless steganographic container...');
    await yieldMainThread();
    const finalImgData = new ImageData(modifiedPx, w, h);
    ctx.putImageData(finalImgData, 0, 0);
    return new Promise<string>((resolve) => {
      (ctx.canvas as HTMLCanvasElement).toBlob(
        (blob) => {
          onProgress?.(100, 'Encoding complete!');
          resolve(URL.createObjectURL(blob!));
        },
        'image/png',
      );
    });
  } finally {
    // Memory scrubbing for sensitive buffers
    zeroFill(stream);
    zeroFill(chunks6);
    zeroFill(nibbles);
  }
}

// ── Truly Deniable Uniform Entropy Dual-Vault (VeraCrypt-Style) Encoder ───────
export async function encodeHoneyVault(
  carrierSrc: string,
  primaryPayload: Uint8Array | string,
  primaryPassword: string,
  decoyPayload: Uint8Array | string,
  decoyPassword: string,
  density: CapacityDensity = 'lsb6',
  maxDimension: number = 0,
  onProgress?: ProgressCallback,
): Promise<string> {
  onProgress?.(10, 'Formatting decoy and primary payload partitions...');
  const rawDecoy = typeof decoyPayload === 'string' ? enc.encode(decoyPayload) : decoyPayload;
  const rawPrimary = typeof primaryPayload === 'string' ? enc.encode(primaryPayload) : primaryPayload;

  // Prefix each inner payload with 4-byte LE length to avoid plaintext framing
  const decoyInner = new Uint8Array(4 + rawDecoy.length);
  decoyInner.set(u32LE(rawDecoy.length), 0);
  decoyInner.set(rawDecoy, 4);

  const primaryInner = new Uint8Array(4 + rawPrimary.length);
  primaryInner.set(u32LE(rawPrimary.length), 0);
  primaryInner.set(rawPrimary, 4);

  onProgress?.(25, 'Encrypting decoy payload (Outer Block)...');
  const encDecoy = await aesEncrypt(decoyInner, decoyPassword);

  onProgress?.(45, 'Encrypting primary payload (Hidden Block)...');
  const encPrimary = await aesEncrypt(primaryInner, primaryPassword);

  onProgress?.(60, 'Calculating carrier capacity & allocating uniform entropy buffer...');
  const { ctx, w, h } = await loadCanvas(carrierSrc, maxDimension > 0 ? maxDimension : undefined);
  const totalCap = calculateCapacity(w, h, density);

  const minRequired = encDecoy.length + encPrimary.length + 32;
  if (totalCap < minRequired) {
    throw new Error(
      `Carrier capacity (${totalCap.toLocaleString()} B) is insufficient for both decoy and hidden vaults (requires at least ${minRequired.toLocaleString()} B). Please use a larger image.`
    );
  }

  // Allocate full-capacity buffer and fill completely with CSPRNG pseudo-random noise
  const fullStream = new Uint8Array(totalCap);
  for (let i = 0; i < fullStream.length; i += 65536) {
    const chunk = fullStream.subarray(i, Math.min(i + 65536, fullStream.length));
    crypto.getRandomValues(chunk);
  }

  // Place Decoy (Outer Block) at Offset 0
  fullStream.set(encDecoy, 0);

  // Place Primary (Hidden Block) at Tail Offset: C_total - encPrimary.length
  const tailOffset = totalCap - encPrimary.length;
  fullStream.set(encPrimary, tailOffset);

  onProgress?.(80, 'Injecting uniform entropy container into carrier...');
  // Embed fullStream into carrier with 0 magic bytes and 0 plaintext length fields
  return encodeImage(carrierSrc, fullStream, undefined, density, maxDimension, onProgress);
}

// ── Decode result types ───────────────────────────────────────────────────────
export interface EmbeddedFile {
  name: string;
  data: Uint8Array;
  size?: number;
}

export type DecodeResult =
  | { type: 'text';   content: string; rawBytes?: Uint8Array; isDecoy?: boolean }
  | { type: 'file';   name: string; data: Uint8Array; isDecoy?: boolean }
  | { type: 'vault';  files: EmbeddedFile[]; isDecoy?: boolean }
  | { type: 'binary'; data: Uint8Array; isDecoy?: boolean };

// ── Helper: Trial Decryption on Buffer at Candidate Offsets ───────────────────
async function tryTrialDecrypt(
  buffer: Uint8Array,
  password: string
): Promise<{ result: DecodeResult; isDecoy: boolean } | null> {
  if (buffer.length < 28) return null;

  // 1. Try decrypting from start of buffer (Outer / Decoy Block)
  try {
    const pt = await aesDecrypt(buffer, password);
    if (pt.length >= 4) {
      const declaredLen = readU32LE(pt, 0);
      if (declaredLen > 0 && declaredLen <= pt.length - 4) {
        const payloadData = pt.subarray(4, 4 + declaredLen);
        const unpacked = unpackPayload(payloadData);
        return { result: unpacked, isDecoy: true };
      }
    }
    const unpacked = unpackPayload(pt);
    return { result: unpacked, isDecoy: false };
  } catch {
    // Offset 0 failed, proceed to tail scanning
  }

  // 2. Scan tail regions for Tail-Aligned Hidden Block
  // The hidden block starts with [Salt: 16B][IV: 12B] and ends at buffer.length
  // Candidate sizes: between 60 bytes and buffer.length - 60 bytes
  const maxScanLen = Math.min(buffer.length - 30, 20_000_000);
  const minBlockLen = 44; // 16 Salt + 12 IV + 4 len prefix + 12 tag minimum

  // Quick check at direct tail slices if buffer is large
  const candidateSteps = [
    minBlockLen,
    128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152
  ];

  for (const step of candidateSteps) {
    if (step < buffer.length - 30) {
      const slice = buffer.subarray(buffer.length - step);
      try {
        const pt = await aesDecrypt(slice, password);
        if (pt.length >= 4) {
          const declaredLen = readU32LE(pt, 0);
          if (declaredLen > 0 && declaredLen <= pt.length - 4) {
            const payloadData = pt.subarray(4, 4 + declaredLen);
            const unpacked = unpackPayload(payloadData);
            return { result: unpacked, isDecoy: false };
          }
        }
        const unpacked = unpackPayload(pt);
        return { result: unpacked, isDecoy: false };
      } catch {
        // continue
      }
    }
  }

  return null;
}

// ── Internal LSB-4 Decoder ────────────────────────────────────────────────────
async function tryDecodeLsb4(
  px: Uint8ClampedArray,
  totalRgbChannels: number,
  password?: string,
  onProgress?: ProgressCallback,
): Promise<DecodeResult> {
  const headerNibbles = new Uint8Array(8);
  let payloadNibbles: Uint8Array | null = null;
  let rawBytes: Uint8Array | null = null;

  try {
    for (let ni = 0; ni < 8; ni++) {
      const pxIdx = ((ni / 3) | 0) * 4 + (ni % 3);
      if (pxIdx >= px.length) throw new Error('Invalid carrier stream');
      headerNibbles[ni] = px[pxIdx] & 0x0f;
    }

    const lenBytes = nibblesToBytes(headerNibbles);
    const len = readU32LE(lenBytes);
    const maxBytes = Math.floor((totalRgbChannels - 8) / 2);
    if (len === 0 || len > maxBytes) {
      throw new Error('No valid LSB-4 payload detected');
    }

    const targetNibbles = len * 2;
    payloadNibbles = new Uint8Array(targetNibbles);
    for (let pni = 0; pni < targetNibbles; pni++) {
      const k = 8 + pni;
      const pxIdx = ((k / 3) | 0) * 4 + (k % 3);
      if (pxIdx >= px.length) throw new Error('Stream truncated');
      payloadNibbles[pni] = px[pxIdx] & 0x0f;
    }

    rawBytes = nibblesToBytes(payloadNibbles);

    // Check for Legacy Honey-Vault (Backward Compatibility)
    if (rawBytes.length >= 19 && constantTimeCompare(rawBytes.subarray(0, 11), GHOST_HONEY_SIG)) {
      onProgress?.(50, 'Analyzing legacy Honey-Vault container...');
      let off = 11;
      const decoyLen = readU32LE(rawBytes, off); off += 4;
      if (off + decoyLen <= rawBytes.length) {
        const decoyCipher = rawBytes.subarray(off, off + decoyLen); off += decoyLen;
        if (off + 4 <= rawBytes.length) {
          const primaryLen = readU32LE(rawBytes, off); off += 4;
          if (off + primaryLen <= rawBytes.length) {
            const primaryCipher = rawBytes.subarray(off, off + primaryLen);
            if (password && password.length > 0) {
              try {
                const pt = await aesDecrypt(decoyCipher, password);
                const res = unpackPayload(pt);
                res.isDecoy = true;
                return res;
              } catch {
                // Decoy failed, try primary vault
              }
              const pt = await aesDecrypt(primaryCipher, password);
              return unpackPayload(pt);
            }
          }
        }
      }
    }

    // Check for Asymmetric Public-Key Encrypted Payload
    if (isAsymmetricPayload(rawBytes)) {
      if (password && password.length > 0) {
        onProgress?.(65, 'Decrypting with asymmetric Private Key...');
        const pt = await decryptWithPrivateKey(rawBytes, password);
        return unpackPayload(pt);
      } else {
        throw new Error('This payload is asymmetrically encrypted with a Public Key. Please unlock using your recipient Private Key.');
      }
    }

    if (password && password.length > 0) {
      onProgress?.(65, 'Authenticating and trial-decrypting payload...');
      
      // First try True Deniable Trial Decrypt
      const deniableTrial = await tryTrialDecrypt(rawBytes, password);
      if (deniableTrial) {
        deniableTrial.result.isDecoy = deniableTrial.isDecoy;
        return deniableTrial.result;
      }

      // Direct fallback
      const data = await aesDecrypt(rawBytes, password);
      return unpackPayload(data);
    }

    return unpackPayload(rawBytes);
  } finally {
    zeroFill(headerNibbles);
    zeroFill(payloadNibbles);
  }
}

// ── Internal LSB-6 Decoder ────────────────────────────────────────────────────
async function tryDecodeLsb6(
  px: Uint8ClampedArray,
  totalRgbChannels: number,
  password?: string,
  onProgress?: ProgressCallback,
): Promise<DecodeResult> {
  const headerChunks = new Uint8Array(6);
  let allChunks: Uint8Array | null = null;

  try {
    for (let ci = 0; ci < 6; ci++) {
      const pxIdx = ((ci / 3) | 0) * 4 + (ci % 3);
      if (pxIdx >= px.length) throw new Error('Invalid carrier stream');
      headerChunks[ci] = px[pxIdx] & 0x3f;
    }

    const lenBytes = sixBitChunksToBytes(headerChunks, 4);
    const len = readU32LE(lenBytes);
    const maxBytes = Math.floor((totalRgbChannels * 6 - 32) / 8);
    if (len === 0 || len > maxBytes) {
      throw new Error('No valid LSB-6 payload detected');
    }

    const totalBits = (4 + len) * 8;
    const totalChunks = Math.ceil(totalBits / 6);
    allChunks = new Uint8Array(totalChunks);
    allChunks.set(headerChunks, 0);

    for (let pci = 6; pci < totalChunks; pci++) {
      const pxIdx = ((pci / 3) | 0) * 4 + (pci % 3);
      if (pxIdx >= px.length) throw new Error('Stream truncated');
      allChunks[pci] = px[pxIdx] & 0x3f;
    }

    const streamBytes = sixBitChunksToBytes(allChunks, 4 + len);
    const rawData = new Uint8Array(len);
    rawData.set(streamBytes.subarray(4));

    // Check for Honey-Vault (Plausible Deniability Dual-Payload)
    if (rawData.length >= 19 && constantTimeCompare(rawData.subarray(0, 11), GHOST_HONEY_SIG)) {
      onProgress?.(50, 'Analyzing Honey-Vault dual container...');
      let off = 11;
      const decoyLen = readU32LE(rawData, off); off += 4;
      if (off + decoyLen <= rawData.length) {
        const decoyCipher = rawData.subarray(off, off + decoyLen); off += decoyLen;
        if (off + 4 <= rawData.length) {
          const primaryLen = readU32LE(rawData, off); off += 4;
          if (off + primaryLen <= rawData.length) {
            const primaryCipher = rawData.subarray(off, off + primaryLen);
            if (password && password.length > 0) {
              try {
                const pt = await aesDecrypt(decoyCipher, password);
                const res = unpackPayload(pt);
                res.isDecoy = true;
                return res;
              } catch {
                // Decoy failed, try primary vault
              }
              const pt = await aesDecrypt(primaryCipher, password);
              return unpackPayload(pt);
            }
          }
        }
      }
    }

    // Check for Asymmetric Public-Key Encrypted Payload
    if (isAsymmetricPayload(rawData)) {
      if (password && password.length > 0) {
        onProgress?.(65, 'Decrypting with asymmetric Private Key...');
        const pt = await decryptWithPrivateKey(rawData, password);
        return unpackPayload(pt);
      } else {
        throw new Error('This payload is asymmetrically encrypted with a Public Key. Please unlock using your recipient Private Key.');
      }
    }

    if (password && password.length > 0) {
      onProgress?.(65, 'Authenticating and trial-decrypting payload...');

      // First try True Deniable Trial Decrypt
      const deniableTrial = await tryTrialDecrypt(rawData, password);
      if (deniableTrial) {
        deniableTrial.result.isDecoy = deniableTrial.isDecoy;
        return deniableTrial.result;
      }

      // Direct fallback
      const data = await aesDecrypt(rawData, password);
      return unpackPayload(data);
    }

    return unpackPayload(rawData);
  } finally {
    zeroFill(headerChunks);
    zeroFill(allChunks);
  }
}

// ── Decode (main) auto-detecting LSB-6 and LSB-4 ───────────────────────────────
export async function decodeImage(
  stegoSrc: string,
  password?: string,
  onProgress?: ProgressCallback,
): Promise<DecodeResult> {
  onProgress?.(15, 'Loading carrier pixel matrix...');
  const { ctx, w, h } = await loadCanvas(stegoSrc);
  const px = ctx.getImageData(0, 0, w, h).data;
  const totalRgbChannels = Math.floor((px.length / 4) * 3);

  onProgress?.(35, 'Detecting steganographic bitstream density (LSB-6 / LSB-4)...');
  
  let res6: DecodeResult | null = null;
  let err6: any = null;
  try {
    res6 = await tryDecodeLsb6(px, totalRgbChannels, password, onProgress);
    if (res6 && res6.type !== 'binary') {
      onProgress?.(100, 'Payload extracted successfully!');
      return res6;
    }
  } catch (e) {
    err6 = e;
  }

  let res4: DecodeResult | null = null;
  let err4: any = null;
  try {
    res4 = await tryDecodeLsb4(px, totalRgbChannels, password, onProgress);
    if (res4 && res4.type !== 'binary') {
      onProgress?.(100, 'Payload extracted successfully!');
      return res4;
    }
  } catch (e) {
    err4 = e;
  }

  // If one produced binary, return whichever succeeded
  if (res6) {
    onProgress?.(100, 'Payload extracted successfully!');
    return res6;
  }
  if (res4) {
    onProgress?.(100, 'Payload extracted successfully!');
    return res4;
  }

  throw err6 || err4 || new Error('No valid steganographic payload detected.');
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

  for (let i = 0; i < ad.length; i += 4) {
    let diffSum = 0;
    for (let c = 0; c < 3; c++) {
      const diff = Math.abs(ad[i + c] - bd[i + c]);
      diffSum += diff;
      mseSum += diff * diff;
    }

    const avgDiff = diffSum / 3;
    const amp = Math.min(255, avgDiff * 16);

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

  return {
    mse,
    psnr,
    diffUrl: diffCanvas.toDataURL('image/png'),
    heatmapUrl: heatCanvas.toDataURL('image/png'),
  };
}

// ── Bit-plane extraction (0 = LSB, 7 = MSB) ──────────────────────────────────
export async function getBitPlane(src: string, bit: number): Promise<string> {
  const { ctx, w, h } = await loadCanvas(src, 1920);
  const imgData = ctx.getImageData(0, 0, w, h);
  const px = imgData.data;

  const mask = 1 << Math.max(0, Math.min(7, bit));
  for (let i = 0; i < px.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      px[i + c] = (px[i + c] & mask) ? 255 : 0;
    }
    px[i + 3] = 255;
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
