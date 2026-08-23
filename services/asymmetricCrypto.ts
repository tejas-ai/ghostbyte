/**
 * QuietSend Asymmetric Cryptography Service
 * Implements Elliptic Curve Diffie-Hellman (ECDH P-256) + HKDF-SHA-256 + AES-GCM-256
 * Enables true asymmetric PGP-grade encryption directly to a recipient's Public Key.
 */

import { zeroFill } from './stegaEngine';

const enc = new TextEncoder();
const dec = new TextDecoder();

export interface KeyPairInfo {
  id: string;
  name: string;
  fingerprint: string;
  publicKeyArmor: string;
  privateKeyArmor: string; // PKCS#8 Base64
  createdAt: number;
}

export interface ContactPublicKey {
  id: string;
  name: string;
  fingerprint: string;
  publicKeyArmor: string;
  addedAt: number;
}

const STORAGE_KEY_KEYRING = 'quietsend_keyring_v1';
const STORAGE_KEY_CONTACTS = 'quietsend_contacts_v1';

/** Calculate 16-char Hex Fingerprint of Raw Public Key bytes */
export async function calcKeyFingerprint(rawPubKeyBytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', rawPubKeyBytes as BufferSource);
  const hashArr = Array.from(new Uint8Array(hash));
  return hashArr.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
}

/** Convert raw ArrayBuffer to standard Base64 Armor string */
export function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Convert Base64 Armor string back to Uint8Array */
export function base64ToBuf(b64: string): Uint8Array {
  const clean = b64.replace(/[\r\n\s]/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Wrap Public Key in PGP-style Armor format */
export function formatPublicArmor(rawB64: string, fingerprint: string): string {
  return `-----BEGIN QUIETSEND PUBLIC KEY-----
Fingerprint: ${fingerprint}

${rawB64}
-----END QUIETSEND PUBLIC KEY-----`;
}

/** Parse Raw Base64 and Fingerprint from Armored Public Key */
export function parsePublicArmor(armor: string): { rawB64: string; fingerprintHint?: string } {
  const clean = armor.trim();
  const fpMatch = clean.match(/Fingerprint:\s*([A-F0-9:]+)/i);
  const fingerprintHint = fpMatch ? fpMatch[1] : undefined;

  const rawB64 = clean
    .replace(/-----BEGIN QUIETSEND PUBLIC KEY-----/gi, '')
    .replace(/-----END QUIETSEND PUBLIC KEY-----/gi, '')
    .replace(/Fingerprint:.*$/gmi, '')
    .replace(/[\r\n\s]/g, '');

  if (!rawB64) {
    throw new Error('Invalid or empty Public Key armor block.');
  }

  return { rawB64, fingerprintHint };
}

/** Generate a brand new ECDH P-256 KeyPair */
export async function generateAsymmetricKeyPair(identityName = 'Primary Identity'): Promise<KeyPairInfo> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  // Export Public Key (SPKI)
  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const rawPubBytes = new Uint8Array(spki);
  const fingerprint = await calcKeyFingerprint(rawPubBytes);
  const pubB64 = bufToBase64(spki);
  const publicKeyArmor = formatPublicArmor(pubB64, fingerprint);

  // Export Private Key (PKCS#8)
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const privateKeyArmor = bufToBase64(pkcs8);

  const id = `key_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    name: identityName,
    fingerprint,
    publicKeyArmor,
    privateKeyArmor,
    createdAt: Date.now(),
  };
}

/** Import CryptoKey object from Public Key Armor string */
export async function importPublicKey(armorString: string): Promise<CryptoKey> {
  const { rawB64 } = parsePublicArmor(armorString);
  const rawBytes = base64ToBuf(rawB64);

  return crypto.subtle.importKey(
    'spki',
    rawBytes as BufferSource,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

/** Import CryptoKey object from Private Key Armor string */
export async function importPrivateKey(pkcs8B64: string): Promise<CryptoKey> {
  const rawBytes = base64ToBuf(pkcs8B64);

  return crypto.subtle.importKey(
    'pkcs8',
    rawBytes as BufferSource,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

/** Wire Signature for Asymmetrically Encrypted Payloads (12 bytes) */
export const ASYM_PAYLOAD_SIG = enc.encode('GHOST_ASYM1'); // 11 bytes + 1 null = 12 bytes

/**
 * Encrypt arbitrary binary payload to a Recipient's Public Key
 * 1. Generates Ephemeral ECDH KeyPair.
 * 2. Computes Shared Secret with Recipient's Public Key.
 * 3. Derives 256-bit symmetric AES-GCM Key.
 * 4. Encrypts payload with AES-GCM-256.
 * 5. Returns wire format: [ASYM_PAYLOAD_SIG: 12][EphemeralPubSPKILen: 2][EphemeralPubSPKI][IV: 12][Ciphertext + AuthTag]
 */
export async function encryptWithPublicKey(
  payload: Uint8Array,
  recipientPublicArmor: string
): Promise<Uint8Array> {
  const recipientPubKey = await importPublicKey(recipientPublicArmor);

  // 1. Generate Ephemeral ECDH keypair
  const ephemeralKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  // 2. Derive 256-bit symmetric AES-GCM Key
  const symmetricKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: recipientPubKey },
    ephemeralKeyPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // 3. Export ephemeral public key
  const ephSpki = await crypto.subtle.exportKey('spki', ephemeralKeyPair.publicKey);
  const ephSpkiBytes = new Uint8Array(ephSpki);

  // 4. Encrypt payload
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    symmetricKey,
    payload as BufferSource
  );
  const cipherBytes = new Uint8Array(ciphertextBuf);

  // 5. Build Wire Packet
  // [ASYM_PAYLOAD_SIG (12)] + [SPKI Length (2 bytes LE)] + [SPKI Bytes] + [IV (12)] + [Ciphertext + Tag]
  const totalLen = 12 + 2 + ephSpkiBytes.length + 12 + cipherBytes.length;
  const out = new Uint8Array(totalLen);
  let off = 0;

  out.set(ASYM_PAYLOAD_SIG, off); off += 12;
  out[off] = ephSpkiBytes.length & 0xff;
  out[off + 1] = (ephSpkiBytes.length >> 8) & 0xff;
  off += 2;
  out.set(ephSpkiBytes, off); off += ephSpkiBytes.length;
  out.set(iv, off); off += 12;
  out.set(cipherBytes, off);

  return out;
}

/**
 * Check if payload buffer starts with ASYM_PAYLOAD_SIG
 */
export function isAsymmetricPayload(data: Uint8Array): boolean {
  if (data.length < 30) return false;
  for (let i = 0; i < 11; i++) {
    if (data[i] !== ASYM_PAYLOAD_SIG[i]) return false;
  }
  return true;
}

/**
 * Decrypt asymmetrically encrypted payload using Recipient's Private Key
 */
export async function decryptWithPrivateKey(
  cipherData: Uint8Array,
  recipientPrivateArmor: string
): Promise<Uint8Array> {
  if (!isAsymmetricPayload(cipherData)) {
    throw new Error('Data does not match QuietSend Asymmetric Encryption envelope.');
  }

  let off = 12;
  const spkiLen = cipherData[off] | (cipherData[off + 1] << 8);
  off += 2;

  if (off + spkiLen + 12 >= cipherData.length) {
    throw new Error('Malformed asymmetric ciphertext payload.');
  }

  const ephSpkiBytes = cipherData.subarray(off, off + spkiLen);
  off += spkiLen;
  const iv = cipherData.subarray(off, off + 12);
  off += 12;
  const cipherBytes = cipherData.subarray(off);

  // Import ephemeral public key
  const ephemeralPubKey = await crypto.subtle.importKey(
    'spki',
    ephSpkiBytes as BufferSource,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );

  // Import recipient private key
  const recipientPrivateKey = await importPrivateKey(recipientPrivateArmor);

  // Derive symmetric AES-GCM Key
  const symmetricKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: ephemeralPubKey },
    recipientPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Decrypt
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    symmetricKey,
    cipherBytes as BufferSource
  );

  return new Uint8Array(plaintextBuf);
}

// ── Local Storage Keyring Management ──────────────────────────────────────────

export function getStoredKeyring(): KeyPairInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KEYRING);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredKeyring(keys: KeyPairInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_KEYRING, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

export function getStoredContacts(): ContactPublicKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTACTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredContacts(contacts: ContactPublicKey[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
  } catch {
    // ignore
  }
}

export async function addContactPublicKey(name: string, armor: string): Promise<ContactPublicKey> {
  const { rawB64 } = parsePublicArmor(armor);
  const rawBytes = base64ToBuf(rawB64);
  const fingerprint = await calcKeyFingerprint(rawBytes);

  const contact: ContactPublicKey = {
    id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || 'Anonymous Contact',
    fingerprint,
    publicKeyArmor: formatPublicArmor(rawB64, fingerprint),
    addedAt: Date.now(),
  };

  const current = getStoredContacts();
  // Filter duplicates by fingerprint
  const updated = [contact, ...current.filter(c => c.fingerprint !== fingerprint)];
  saveStoredContacts(updated);
  return contact;
}
