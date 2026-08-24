/**
 * QuietSend asymmetric cryptography.
 *
 * ECDH P-256 -> HKDF-SHA-256 -> AES-GCM-256, an ECIES construction: the sender
 * generates a throwaway keypair, agrees a secret with the recipient's public
 * key, expands it through HKDF, and encrypts under the result.
 *
 * The HKDF step is new in wire version 2. Version 1 fed the raw ECDH shared
 * secret straight into deriveKey, which takes the leftmost bits of the
 * coordinate with no extraction, no salt and no context binding -- while the
 * module header, the sidebar and the self-test all described it as HKDF. v1
 * envelopes still decrypt, so nothing already encoded is stranded.
 *
 * What this does NOT provide is sender authentication. Anyone holding the
 * recipient's public key can produce a valid envelope claiming to be from
 * anyone, because nothing is signed. Do not describe it as PGP-equivalent.
 */

import { zeroFill } from './stegaEngine';
import { asBufferSource } from './binary';

const enc = new TextEncoder();
const dec = new TextDecoder();

export interface KeyPairInfo {
  id: string;
  name: string;
  fingerprint: string;
  publicKeyArmor: string;
  privateKeyArmor: string; // PKCS#8, Base64
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

/** Binds derived keys to this protocol and version so they cannot be reused elsewhere. */
const HKDF_INFO = enc.encode('QuietSend/v3 ECDH-P256 HKDF-SHA256 AES-GCM-256');

/** Calculate 16-char hex fingerprint of raw public key bytes. */
export async function calcKeyFingerprint(rawPubKeyBytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', asBufferSource(rawPubKeyBytes));
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
}

/** Convert raw bytes to Base64 armor, in chunks so large keys do not blow the call stack. */
export function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Convert Base64 armor back to bytes. */
export function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64.replace(/[\r\n\s]/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Wrap a public key in PGP-style armor. */
export function formatPublicArmor(rawB64: string, fingerprint: string): string {
  return `-----BEGIN QUIETSEND PUBLIC KEY-----
Fingerprint: ${fingerprint}

${rawB64}
-----END QUIETSEND PUBLIC KEY-----`;
}

/** Parse raw Base64 and the stated fingerprint out of armored public key text. */
export function parsePublicArmor(armor: string): { rawB64: string; fingerprintHint?: string } {
  const clean = armor.trim();
  const fpMatch = clean.match(/Fingerprint:\s*([A-F0-9:]+)/i);

  const rawB64 = clean
    .replace(/-----BEGIN QUIETSEND PUBLIC KEY-----/gi, '')
    .replace(/-----END QUIETSEND PUBLIC KEY-----/gi, '')
    .replace(/Fingerprint:.*$/gim, '')
    .replace(/[\r\n\s]/g, '');

  if (!rawB64) throw new Error('Invalid or empty public key armor block.');
  return { rawB64, fingerprintHint: fpMatch ? fpMatch[1] : undefined };
}

/**
 * Verify that armor's stated fingerprint matches the key it actually contains.
 * A mismatch means the block was edited or spliced, and the displayed
 * fingerprint -- the thing a user compares out of band -- cannot be trusted.
 */
export async function verifyArmorFingerprint(armor: string): Promise<{ rawB64: string; fingerprint: string }> {
  const { rawB64, fingerprintHint } = parsePublicArmor(armor);
  const rawBytes = base64ToBuf(rawB64);
  const fingerprint = await calcKeyFingerprint(rawBytes);

  if (fingerprintHint && fingerprintHint.toUpperCase() !== fingerprint) {
    throw new Error(
      `Fingerprint mismatch: this block claims ${fingerprintHint.toUpperCase()} but the key inside is ${fingerprint}. Do not use it.`
    );
  }
  return { rawB64, fingerprint };
}

/** Generate a fresh ECDH P-256 keypair. */
export async function generateAsymmetricKeyPair(identityName = 'Primary Identity'): Promise<KeyPairInfo> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits'],
  );

  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const fingerprint = await calcKeyFingerprint(new Uint8Array(spki));
  const publicKeyArmor = formatPublicArmor(bufToBase64(spki), fingerprint);

  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    id: `key_${Date.now()}_${bufToBase64(crypto.getRandomValues(new Uint8Array(6))).replace(/[^a-z0-9]/gi, '').slice(0, 8)}`,
    name: identityName,
    fingerprint,
    publicKeyArmor,
    privateKeyArmor: bufToBase64(pkcs8),
    createdAt: Date.now(),
  };
}

export async function importPublicKey(armorString: string): Promise<CryptoKey> {
  const { rawB64 } = await verifyArmorFingerprint(armorString);
  return crypto.subtle.importKey(
    'spki',
    asBufferSource(base64ToBuf(rawB64)),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );
}

export async function importPrivateKey(pkcs8B64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    asBufferSource(base64ToBuf(pkcs8B64)),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits'],
  );
}

// ── Wire envelope ─────────────────────────────────────────────────────────────
// [SIG:12][ephSpkiLen:2 LE][ephSpki][iv:12][ciphertext+tag]

/** Current envelope: ECDH -> HKDF-SHA-256 -> AES-GCM. */
export const ASYM_PAYLOAD_SIG_V2 = enc.encode('GHOST_ASYM2');
/** Legacy envelope: ECDH -> AES-GCM with no KDF. Decrypt-only. */
export const ASYM_PAYLOAD_SIG_V1 = enc.encode('GHOST_ASYM1');
/** Retained for callers that imported the old name. */
export const ASYM_PAYLOAD_SIG = ASYM_PAYLOAD_SIG_V2;

const SIG_FIELD_LEN = 12; // 11 signature bytes + one zero byte

function matchesSig(data: Uint8Array, sig: Uint8Array): boolean {
  for (let i = 0; i < sig.length; i++) {
    if (data[i] !== sig[i]) return false;
  }
  return true;
}

/** True when the buffer carries either asymmetric envelope version. */
export function isAsymmetricPayload(data: Uint8Array): boolean {
  if (data.length < 30) return false;
  return matchesSig(data, ASYM_PAYLOAD_SIG_V2) || matchesSig(data, ASYM_PAYLOAD_SIG_V1);
}

/**
 * Derive the AES key from an ECDH agreement.
 *
 * v2 runs the shared secret through HKDF-SHA-256, salted with the unique
 * ephemeral public key so both sides reconstruct it without extra state, and
 * tagged with a protocol label. v1 reproduces the old raw-agreement behaviour
 * for decrypting existing envelopes.
 */
async function deriveSharedAesKey(
  privateKey: CryptoKey,
  peerPublicKey: CryptoKey,
  ephSpkiBytes: Uint8Array,
  version: 1 | 2,
): Promise<CryptoKey> {
  if (version === 1) {
    return crypto.subtle.deriveKey(
      { name: 'ECDH', public: peerPublicKey },
      privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    privateKey,
    256,
  );

  const hkdfMaterial = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']);

  // Salt is the ephemeral public key, which is unique per message and always
  // present on the wire, so both sides reconstruct it without extra state.
  // Protocol separation comes from the fixed `info` label.
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: asBufferSource(ephSpkiBytes), info: asBufferSource(HKDF_INFO) },
    hkdfMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt a payload to a recipient's public key. */
export async function encryptWithPublicKey(
  payload: Uint8Array,
  recipientPublicArmor: string,
): Promise<Uint8Array> {
  const recipientPubKey = await importPublicKey(recipientPublicArmor);

  const ephemeral = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits'],
  );
  const ephSpkiBytes = new Uint8Array(await crypto.subtle.exportKey('spki', ephemeral.publicKey));

  const symmetricKey = await deriveSharedAesKey(
    ephemeral.privateKey,
    recipientPubKey,
    ephSpkiBytes,
    2,
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBytes = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: asBufferSource(iv) }, symmetricKey, asBufferSource(payload)),
  );

  const out = new Uint8Array(SIG_FIELD_LEN + 2 + ephSpkiBytes.length + 12 + cipherBytes.length);
  let off = 0;
  out.set(ASYM_PAYLOAD_SIG_V2, off);
  off += SIG_FIELD_LEN; // trailing byte stays zero
  out[off] = ephSpkiBytes.length & 0xff;
  out[off + 1] = (ephSpkiBytes.length >> 8) & 0xff;
  off += 2;
  out.set(ephSpkiBytes, off); off += ephSpkiBytes.length;
  out.set(iv, off); off += 12;
  out.set(cipherBytes, off);

  return out;
}

/** Decrypt an envelope with the recipient's private key. Handles v1 and v2. */
export async function decryptWithPrivateKey(
  cipherData: Uint8Array,
  recipientPrivateArmor: string,
): Promise<Uint8Array> {
  const version: 1 | 2 | null = matchesSig(cipherData, ASYM_PAYLOAD_SIG_V2) ? 2
    : matchesSig(cipherData, ASYM_PAYLOAD_SIG_V1) ? 1
    : null;

  if (version === null) {
    throw new Error('Data does not match the QuietSend asymmetric envelope format.');
  }

  let off = SIG_FIELD_LEN;
  const spkiLen = cipherData[off] | (cipherData[off + 1] << 8);
  off += 2;

  if (spkiLen <= 0 || off + spkiLen + 12 >= cipherData.length) {
    throw new Error('Malformed asymmetric ciphertext payload.');
  }

  const ephSpkiBytes = cipherData.subarray(off, off + spkiLen); off += spkiLen;
  const iv = cipherData.subarray(off, off + 12); off += 12;
  const cipherBytes = cipherData.subarray(off);

  const ephemeralPubKey = await crypto.subtle.importKey(
    'spki',
    asBufferSource(ephSpkiBytes),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );

  const recipientPrivateKey = await importPrivateKey(recipientPrivateArmor);

  const symmetricKey = await deriveSharedAesKey(
    recipientPrivateKey,
    ephemeralPubKey,
    ephSpkiBytes,
    version,
  );

  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(iv) },
    symmetricKey,
    asBufferSource(cipherBytes),
  );

  return new Uint8Array(plaintextBuf);
}

// ── Local keyring storage ─────────────────────────────────────────────────────
//
// Private keys are held in localStorage as Base64 PKCS#8. That is readable by
// any script running on this origin, so the CSP (no unsafe-inline, no
// unsafe-eval) is what protects it. Backups leave the machine and are encrypted
// under a passphrase instead -- see exportEncryptedBackup.

export function getStoredKeyring(): KeyPairInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KEYRING);
    if (!raw) return [];
    if (raw.startsWith('QS_ENC:')) {
      const bytes = base64ToBuf(raw.slice(7));
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] ^= (0xa5 ^ (i & 0x7f));
      }
      return JSON.parse(dec.decode(bytes));
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredKeyring(keys: KeyPairInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_KEYRING, JSON.stringify(keys));
  } catch {
    // storage full or blocked
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
    // storage full or blocked
  }
}

export async function addContactPublicKey(name: string, armor: string): Promise<ContactPublicKey> {
  const { rawB64, fingerprint } = await verifyArmorFingerprint(armor);

  const contact: ContactPublicKey = {
    id: `contact_${Date.now()}_${bufToBase64(crypto.getRandomValues(new Uint8Array(6))).replace(/[^a-z0-9]/gi, '').slice(0, 8)}`,
    name: name.trim() || 'Anonymous Contact',
    fingerprint,
    publicKeyArmor: formatPublicArmor(rawB64, fingerprint),
    addedAt: Date.now(),
  };

  saveStoredContacts([contact, ...getStoredContacts().filter((c) => c.fingerprint !== fingerprint)]);
  return contact;
}

// ── Encrypted keyring backup ──────────────────────────────────────────────────

const BACKUP_MAGIC = 'QUIETSEND-KEYRING-BACKUP';
const BACKUP_ITERATIONS = 600_000;

export interface EncryptedBackup {
  format: string;
  version: 2;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  iv: string;
  ciphertext: string;
}

async function backupKey(passphrase: string, salt: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  const pwBytes = enc.encode(passphrase);
  try {
    const material = await crypto.subtle.importKey('raw', asBufferSource(pwBytes), 'PBKDF2', false, ['deriveKey']);
    return await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: asBufferSource(salt), iterations: BACKUP_ITERATIONS, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      usage,
    );
  } finally {
    zeroFill(pwBytes);
  }
}

/**
 * Serialise the keyring and contacts into a passphrase-encrypted blob.
 *
 * The previous export wrote every private key to disk as plaintext JSON with no
 * warning, which is the single worst place for them: backup folders sync to
 * cloud storage and survive long after the browser profile is gone.
 */
export async function exportEncryptedBackup(
  keyring: KeyPairInfo[],
  contacts: ContactPublicKey[],
  passphrase: string,
): Promise<Blob> {
  if (!passphrase || passphrase.length < 8) {
    throw new Error('Choose a backup passphrase of at least 8 characters. This file contains your private keys.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await backupKey(passphrase, salt, ['encrypt']);

  const plaintext = enc.encode(JSON.stringify({ keyring, contacts, exportedAt: new Date().toISOString() }));
  try {
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: asBufferSource(iv) }, key, asBufferSource(plaintext));
    const doc: EncryptedBackup = {
      format: BACKUP_MAGIC,
      version: 2,
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: BACKUP_ITERATIONS, salt: bufToBase64(salt) },
      iv: bufToBase64(iv),
      ciphertext: bufToBase64(new Uint8Array(ct)),
    };
    return new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  } finally {
    zeroFill(plaintext);
  }
}

/** Restore a passphrase-encrypted backup produced by exportEncryptedBackup. */
export async function importEncryptedBackup(
  fileText: string,
  passphrase: string,
): Promise<{ keyring: KeyPairInfo[]; contacts: ContactPublicKey[] }> {
  let doc: EncryptedBackup;
  try {
    doc = JSON.parse(fileText);
  } catch {
    throw new Error('That file is not a QuietSend keyring backup.');
  }

  if (doc?.format !== BACKUP_MAGIC) {
    throw new Error('That file is not a QuietSend keyring backup.');
  }

  const salt = base64ToBuf(doc.kdf.salt);
  const iv = base64ToBuf(doc.iv);
  const ct = base64ToBuf(doc.ciphertext);
  const key = await backupKey(passphrase, salt, ['decrypt']);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: asBufferSource(iv) }, key, asBufferSource(ct));
  } catch {
    throw new Error('Wrong passphrase, or the backup file is damaged.');
  }

  const parsed = JSON.parse(new TextDecoder().decode(plaintext));
  return {
    keyring: Array.isArray(parsed.keyring) ? parsed.keyring : [],
    contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
  };
}
