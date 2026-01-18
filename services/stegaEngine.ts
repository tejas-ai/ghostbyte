
/**
 * Advanced LSB Steganography Engine with AES-GCM Encryption
 * Handles PNG/BMP (Canvas) and lossless formats
 * Now using 4 bits per channel (LSB4) for significantly increased capacity.
 */

export const HEADER_SIZE = 32; // bits for payload length
const BITS_PER_CHANNEL = 4; // Use 4 least significant bits instead of 1
const ENCRYPTED_MAGIC = "STG!"; // 4-byte marker for encrypted payloads

// --- Encryption Helpers ---

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  if (!crypto.subtle) {
    throw new Error("Encryption requires a Secure Context (HTTPS or localhost). Please deploy the app or use HTTPS.");
  }
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(data: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  const magic = new TextEncoder().encode(ENCRYPTED_MAGIC);
  const result = new Uint8Array(magic.length + salt.length + iv.length + encrypted.byteLength);
  result.set(magic, 0);
  result.set(salt, magic.length);
  result.set(iv, magic.length + salt.length);
  result.set(new Uint8Array(encrypted), magic.length + salt.length + iv.length);
  return result;
}

async function decryptData(data: Uint8Array, password: string): Promise<Uint8Array> {
  const magic = new TextEncoder().encode(ENCRYPTED_MAGIC);
  // Check magic
  for (let i = 0; i < magic.length; i++) {
    if (data[i] !== magic[i]) throw new Error("Payload is not encrypted or uses an incompatible version.");
  }

  const salt = data.slice(4, 20);
  const iv = data.slice(20, 32);
  const encrypted = data.slice(32);
  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    return new Uint8Array(decrypted);
  } catch (e) {
    throw new Error("Decryption failed. Incorrect password or corrupted data.");
  }
}

// --- Main API ---

export const getCarrierCapacity = async (file: File): Promise<number> => {
  const img = await loadImage(file);
  // Each pixel has 3 usable channels (R, G, B), BITS_PER_CHANNEL bits per channel
  const totalBits = img.width * img.height * 3 * BITS_PER_CHANNEL;
  // Subtract header and convert to bytes
  return Math.max(0, Math.floor((totalBits - HEADER_SIZE) / 8));
};

export const encodeImage = async (
  carrier: File,
  payload: string | Uint8Array,
  password?: string
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');

  const img = await loadImage(carrier);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Usable channels: (Total elements / 4) pixels * 3 channels/pixel
  const totalChannels = (data.length / 4) * 3;
  const capacityBits = totalChannels * BITS_PER_CHANNEL;

  let payloadData = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload;

  // Encrypt if password provided
  if (password && password.length > 0) {
    payloadData = await encryptData(payloadData, password);
  }

  const bits = toBitArray(payloadData);

  if (bits.length + HEADER_SIZE > capacityBits) {
    throw new Error(`Payload too large. Max capacity: ${Math.floor((capacityBits - HEADER_SIZE) / 8)} bytes`);
  }

  // Prepend header (length of payload in bits)
  const headerBits = toBitArrayFromNumber(bits.length, HEADER_SIZE);
  const fullBits = [...headerBits, ...bits];

  let bitIdx = 0;
  const mask = (1 << BITS_PER_CHANNEL) - 1;
  const invertedMask = ~mask & 0xFF;

  for (let i = 0; i < data.length && bitIdx < fullBits.length; i++) {
    if ((i + 1) % 4 === 0) continue; // Skip Alpha channel

    let chunk = 0;
    for (let b = 0; b < BITS_PER_CHANNEL && bitIdx < fullBits.length; b++) {
      if (fullBits[bitIdx]) chunk |= (1 << b);
      bitIdx++;
    }

    data[i] = (data[i] & invertedMask) | chunk;
  }

  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
};

export const decodeImage = async (file: File, password?: string): Promise<Uint8Array> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');

  const img = await loadImage(file);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Read header (32 bits)
  const headerBits: number[] = [];
  let bitIdx = 0;
  let dataIdx = 0;
  const mask = (1 << BITS_PER_CHANNEL) - 1;

  while (bitIdx < HEADER_SIZE && dataIdx < data.length) {
    if ((dataIdx + 1) % 4 === 0) {
      dataIdx++;
      continue;
    }

    const val = data[dataIdx] & mask;
    for (let b = 0; b < BITS_PER_CHANNEL && bitIdx < HEADER_SIZE; b++) {
      headerBits.push((val >> b) & 1);
      bitIdx++;
    }
    dataIdx++;
  }

  const payloadSizeBits = fromBitArrayToNumber(headerBits);
  if (payloadSizeBits <= 0 || payloadSizeBits > data.length * BITS_PER_CHANNEL) {
    throw new Error('No valid payload detected or file is corrupted.');
  }

  // Read payload
  const payloadBits: number[] = [];
  let payloadBitIdx = 0;

  // We need to resume from exactly where we left off in the last channel if the header didn't align
  // However, for simplicity with fixed header size and fixed bits per channel, 
  // we just start extraction from the beginning and skip HEADER_SIZE bits.

  let currentBitIdx = 0;
  let currentDataIdx = 0;
  while (payloadBitIdx < payloadSizeBits && currentDataIdx < data.length) {
    if ((currentDataIdx + 1) % 4 === 0) {
      currentDataIdx++;
      continue;
    }

    const val = data[currentDataIdx] & mask;
    for (let b = 0; b < BITS_PER_CHANNEL && payloadBitIdx < payloadSizeBits; b++) {
      if (currentBitIdx >= HEADER_SIZE) {
        payloadBits.push((val >> b) & 1);
        payloadBitIdx++;
      }
      currentBitIdx++;
    }
    currentDataIdx++;
  }

  let extractedData = fromBitArray(payloadBits);

  // Decrypt if password provided
  if (password && password.length > 0) {
    extractedData = await decryptData(extractedData, password);
  }

  return extractedData;
};

export const compareImages = async (original: File, encoded: File): Promise<{ mse: number; psnr: number; diffUrl: string }> => {
  const img1 = await loadImage(original);
  const img2 = await loadImage(encoded);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const w = Math.max(img1.width, img2.width);
  const h = Math.max(img1.height, img2.height);
  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(img1, 0, 0);
  const data1 = ctx.getImageData(0, 0, w, h).data;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img2, 0, 0);
  const data2 = ctx.getImageData(0, 0, w, h).data;

  let sumSquaredError = 0;
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = w;
  diffCanvas.height = h;
  const diffCtx = diffCanvas.getContext('2d')!;
  const diffData = diffCtx.createImageData(w, h);

  for (let i = 0; i < data1.length; i += 4) {
    const rDiff = Math.abs(data1[i] - data2[i]);
    const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
    const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);

    sumSquaredError += (rDiff ** 2 + gDiff ** 2 + bDiff ** 2) / 3;

    // Amplify differences for visibility
    diffData.data[i] = rDiff * 16;
    diffData.data[i + 1] = gDiff * 16;
    diffData.data[i + 2] = bDiff * 16;
    diffData.data[i + 3] = 255;
  }

  const mse = sumSquaredError / (w * h);
  const psnr = mse === 0 ? 100 : 20 * Math.log10(255 / Math.sqrt(mse));

  diffCtx.putImageData(diffData, 0, 0);
  return { mse, psnr, diffUrl: diffCanvas.toDataURL() };
};

// --- Utilities ---

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const toBitArray = (bytes: Uint8Array): number[] => {
  const bits: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    for (let j = 7; j >= 0; j--) {
      bits.push((bytes[i] >> j) & 1);
    }
  }
  return bits;
};

const toBitArrayFromNumber = (num: number, length: number): number[] => {
  const bits: number[] = [];
  for (let i = length - 1; i >= 0; i--) {
    bits.push((num >> i) & 1);
  }
  return bits;
};

const fromBitArray = (bits: number[]): Uint8Array => {
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j];
    }
    bytes[i] = byte;
  }
  return bytes;
};

const fromBitArrayToNumber = (bits: number[]): number => {
  let num = 0;
  for (let i = 0; i < bits.length; i++) {
    num = (num << 1) | bits[i];
  }
  return num;
};
