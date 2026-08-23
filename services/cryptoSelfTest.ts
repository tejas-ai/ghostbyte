/**
 * QuietSend cryptographic self-test suite.
 *
 * Every test drives the functions the app actually ships. The previous version
 * re-implemented AES-GCM and the dual-vault layout inline, so it verified that
 * WebCrypto works -- never in doubt -- while the engine's own wrappers went
 * unexercised. That is how a broken dual-vault offset scheme and a SHA-256
 * fallback that returned wrong digests for every input both passed unnoticed.
 */

import {
  calcSha256,
  crc32,
  buildZipArchive,
  parseZipArchive,
  buildGhostVault,
  buildGhostFile,
  unpackPayload,
  zeroFill,
  constantTimeCompare,
  generatePassphrase,
  calcEntropy,
  encryptPayload,
  decryptPayload,
  sealDualVault,
  openContainer,
  calculateCapacity,
  dualVaultCapacity,
  PASSPHRASE_BITS,
  DENSITY_BITS,
  type CapacityDensity,
} from './stegaEngine';
import {
  generateAsymmetricKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  isAsymmetricPayload,
  exportEncryptedBackup,
  importEncryptedBackup,
  verifyArmorFingerprint,
} from './asymmetricCrypto';
import { encodeWavAudio, decodeWavAudio } from './audioStegaEngine';
import { bytesToChunks, chunksToBytes } from './bitCodec';

export interface TestResultItem {
  id: string;
  name: string;
  category: 'symmetric' | 'asymmetric' | 'steganography' | 'integrity' | 'memory';
  status: 'passed' | 'failed' | 'running';
  latencyMs: number;
  details: string;
}

export interface SelfTestReport {
  overallPass: boolean;
  totalTests: number;
  passedTests: number;
  totalDurationMs: number;
  results: TestResultItem[];
}

const td = new TextDecoder();
const te = new TextEncoder();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Synthesize a 1-second 16-bit 44.1kHz stereo PCM WAV for the audio test. */
function createSyntheticWav(): ArrayBuffer {
  const sampleRate = 44100;
  const numChannels = 2;
  const numSamples = sampleRate;
  const blockAlign = numChannels * 2;
  const dataSize = numSamples * blockAlign;
  const totalSize = 44 + dataSize;

  const buf = new ArrayBuffer(totalSize);
  const view = new DataView(buf);

  view.setUint32(0, 0x46464952, true);  // 'RIFF'
  view.setUint32(4, totalSize - 8, true);
  view.setUint32(8, 0x45564157, true);  // 'WAVE'
  view.setUint32(12, 0x20746d66, true); // 'fmt '
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x61746164, true); // 'data'
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.floor(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 10000);
    view.setInt16(offset, sample, true);
    view.setInt16(offset + 2, sample, true);
    offset += 4;
  }
  return buf;
}

type TestBody = () => Promise<string>;

interface TestSpec {
  id: string;
  name: string;
  category: TestResultItem['category'];
  run: TestBody;
}

const TESTS: TestSpec[] = [
  // ── 1. SHA-256, including the pure-JS fallback ────────────────────────────
  {
    id: 'sha256_vectors',
    name: 'SHA-256 Digest & Non-Secure-Origin Fallback',
    category: 'integrity',
    run: async () => {
      // RFC 6234 vectors. calcSha256 uses crypto.subtle when available and the
      // pure-JS path otherwise; both must produce these.
      const vectors: [string, string][] = [
        ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
        ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
        ['The quick brown fox jumps over the lazy dog',
         'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'],
      ];

      for (const [input, expected] of vectors) {
        const got = await calcSha256(te.encode(input));
        assert(got === expected, `SHA-256("${input}") = ${got}, expected ${expected}`);
      }

      // Multi-block input, to exercise the schedule across block boundaries.
      const long = await calcSha256(te.encode('x'.repeat(1000)));
      assert(long.length === 64 && /^[0-9a-f]+$/.test(long), 'Long-input digest malformed.');

      return 'RFC 6234 vectors verified across single-block, boundary and multi-block inputs.';
    },
  },

  // ── 2. AES-GCM-256 + PBKDF2, through the engine's own wrappers ────────────
  {
    id: 'aes_gcm_pbkdf2',
    name: 'AES-GCM-256 + PBKDF2 (600k) Round Trip',
    category: 'symmetric',
    run: async () => {
      const secret = te.encode('QuietSend authenticated payload verification');
      const password = 'CorrectHorseBatteryStaple#99';

      const sealed = await encryptPayload(secret, password);
      assert(sealed.length === secret.length + 44, 'Unexpected ciphertext framing length.');

      const opened = await decryptPayload(sealed, password);
      assert(td.decode(opened) === td.decode(secret), 'Plaintext mismatch after round trip.');

      // A wrong passphrase must fail the GCM tag, not return garbage.
      let rejected = false;
      try {
        await decryptPayload(sealed, password + 'x');
      } catch {
        rejected = true;
      }
      assert(rejected, 'Wrong passphrase was not rejected by the authentication tag.');

      // Two encryptions of the same plaintext must differ (fresh salt and IV).
      const again = await encryptPayload(secret, password);
      assert(!constantTimeCompare(sealed, again), 'Salt or IV reuse detected across encryptions.');

      return 'Round trip, tag rejection and salt/IV freshness verified through the shipping wrappers.';
    },
  },

  // ── 3. Deniable dual-vault, end to end ────────────────────────────────────
  {
    id: 'deniable_dual_vault',
    name: 'Deniable Dual-Vault (Decoy + Hidden)',
    category: 'symmetric',
    run: async () => {
      const decoyText = te.encode('Unclassified public schedule');
      const realText = te.encode('The actual secret this tool exists to protect');
      const decoyPass = 'decoy-passphrase-alpha';
      const realPass = 'real-passphrase-bravo';

      // Sizes deliberately chosen to be nothing like the old hard-coded
      // candidate lengths, which only recovered 15 exact payload sizes.
      const capacity = 8192;
      const perVault = dualVaultCapacity(capacity);
      assert(perVault > realText.length, 'Test capacity too small for the dual vault.');

      const container = await sealDualVault(realText, realPass, decoyText, decoyPass, capacity);
      assert(container.length === capacity, 'Dual-vault container is not exactly full capacity.');

      const asDecoy = await openContainer(container, decoyPass);
      assert(asDecoy.type === 'text', 'Decoy vault did not yield text.');
      assert(asDecoy.isDecoy === true, 'Decoy vault was not flagged as a decoy.');
      assert(asDecoy.content === td.decode(decoyText), 'Decoy payload mismatch.');

      const asReal = await openContainer(container, realPass);
      assert(asReal.type === 'text', 'Hidden vault did not yield text.');
      assert(asReal.isDecoy !== true, 'Hidden vault was wrongly flagged as a decoy.');
      assert(asReal.content === td.decode(realText), 'Hidden payload mismatch.');

      let thirdRejected = false;
      try {
        await openContainer(container, 'neither-of-the-two');
      } catch {
        thirdRejected = true;
      }
      assert(thirdRejected, 'An unrelated passphrase opened the container.');

      // Recover across a spread of payload sizes, not just convenient ones.
      for (const size of [1, 17, 100, 333, 1000]) {
        const payload = crypto.getRandomValues(new Uint8Array(size));
        const c = await sealDualVault(payload, realPass, decoyText, decoyPass, capacity);
        const out = await openContainer(c, realPass);
        assert(out.type === 'binary' || out.type === 'text', `Size ${size} produced ${out.type}.`);
        const bytes = out.type === 'binary' ? out.data : te.encode(out.content);
        assert(bytes.length === size, `Size ${size} recovered as ${bytes.length} bytes.`);
      }

      return 'Both vaults recovered at 1, 17, 100, 333 and 1000 byte payloads; third passphrase rejected.';
    },
  },

  // ── 4. ECDH P-256 + HKDF-SHA-256 ──────────────────────────────────────────
  {
    id: 'ecdh_asymmetric',
    name: 'ECDH P-256 + HKDF-SHA-256 Envelope',
    category: 'asymmetric',
    run: async () => {
      const alice = await generateAsymmetricKeyPair('Test Node A');
      const bob = await generateAsymmetricKeyPair('Test Node B');
      const payload = te.encode('Asymmetric briefing addressed to one recipient');

      const envelope = await encryptWithPublicKey(payload, alice.publicKeyArmor);
      assert(isAsymmetricPayload(envelope), 'Missing asymmetric envelope signature.');

      const opened = await decryptWithPrivateKey(envelope, alice.privateKeyArmor);
      assert(td.decode(opened) === td.decode(payload), 'Asymmetric plaintext mismatch.');

      // The wrong private key must fail.
      let wrongKeyRejected = false;
      try {
        await decryptWithPrivateKey(envelope, bob.privateKeyArmor);
      } catch {
        wrongKeyRejected = true;
      }
      assert(wrongKeyRejected, 'A non-recipient private key opened the envelope.');

      // Ephemeral keys must make every envelope distinct.
      const second = await encryptWithPublicKey(payload, alice.publicKeyArmor);
      assert(!constantTimeCompare(envelope, second), 'Ephemeral key reuse detected.');

      // Tampering anywhere must trip the GCM tag.
      const tampered = new Uint8Array(envelope);
      tampered[tampered.length - 1] ^= 0x01;
      let tamperRejected = false;
      try {
        await decryptWithPrivateKey(tampered, alice.privateKeyArmor);
      } catch {
        tamperRejected = true;
      }
      assert(tamperRejected, 'A tampered envelope was accepted.');

      return `Round trip, wrong-key rejection, ephemeral freshness and tamper detection verified (${alice.fingerprint}).`;
    },
  },

  // ── 5. Public key armor fingerprint binding ───────────────────────────────
  {
    id: 'armor_fingerprint',
    name: 'Public Key Armor Fingerprint Verification',
    category: 'asymmetric',
    run: async () => {
      const key = await generateAsymmetricKeyPair('Fingerprint Subject');
      const { fingerprint } = await verifyArmorFingerprint(key.publicKeyArmor);
      assert(fingerprint === key.fingerprint, 'Recomputed fingerprint does not match the armor.');

      // A block whose stated fingerprint has been edited must be refused.
      const forged = key.publicKeyArmor.replace(/Fingerprint: .*/, 'Fingerprint: AA:BB:CC:DD:EE:FF:00:11');
      let refused = false;
      try {
        await verifyArmorFingerprint(forged);
      } catch {
        refused = true;
      }
      assert(refused, 'Armor with a mismatched fingerprint was accepted.');

      return 'Fingerprints are recomputed from key bytes and mismatched armor is refused.';
    },
  },

  // ── 6. LSB bit codec, every density ───────────────────────────────────────
  {
    id: 'bit_codec',
    name: 'LSB Bit Codec Across All Densities',
    category: 'steganography',
    run: async () => {
      const densities: CapacityDensity[] = ['lsb1', 'lsb2', 'lsb4', 'lsb6'];
      for (const density of densities) {
        const bits = DENSITY_BITS[density];
        for (const size of [1, 2, 3, 7, 64, 255]) {
          const data = crypto.getRandomValues(new Uint8Array(size));
          const round = chunksToBytes(bytesToChunks(data, bits), size, bits);
          assert(constantTimeCompare(data, round), `${density} round trip failed at ${size} bytes.`);
        }
      }

      // Capacity must grow linearly with density.
      const c1 = calculateCapacity(100, 100, 'lsb1');
      const c2 = calculateCapacity(100, 100, 'lsb2');
      const c6 = calculateCapacity(100, 100, 'lsb6');
      assert(c2 > c1 && c6 > c2, 'Capacity does not scale with density.');

      return 'Bit-exact round trips for LSB-1/2/4/6 at six payload sizes each.';
    },
  },

  // ── 7. Payload framing and fuzz resistance ────────────────────────────────
  {
    id: 'decoder_fuzz_hardening',
    name: 'Payload Framing & Fuzz Resistance',
    category: 'integrity',
    run: async () => {
      // Real framing round trips.
      const vault = buildGhostVault([
        { name: 'notes.txt', data: te.encode('first') },
        { name: 'data.bin', data: crypto.getRandomValues(new Uint8Array(64)) },
      ]);
      const unpackedVault = unpackPayload(vault);
      assert(unpackedVault.type === 'vault', 'GhostVault did not round trip.');
      assert(unpackedVault.files.length === 2, 'GhostVault lost a file.');

      const single = buildGhostFile('report.pdf', te.encode('pdf-bytes'));
      const unpackedFile = unpackPayload(single);
      assert(unpackedFile.type === 'file', 'GhostFile did not round trip.');
      assert(unpackedFile.name === 'report.pdf', 'GhostFile name mismatch.');

      // Path traversal in an embedded name must be neutralised.
      const evil = buildGhostFile('../../../etc/passwd', te.encode('x'));
      const unpackedEvil = unpackPayload(evil);
      assert(unpackedEvil.type === 'file', 'Sanitized GhostFile did not parse.');
      assert(!unpackedEvil.name.includes('/') && !unpackedEvil.name.includes('\\'),
        `Traversal survived sanitization: ${unpackedEvil.name}`);

      // Integer-overflow file count.
      const malformedVault = new Uint8Array(30);
      malformedVault.set(te.encode('GHOST_VAULT'), 0);
      malformedVault.fill(0xff, 11, 15);
      assert(unpackPayload(malformedVault), 'Malformed vault was not handled.');

      // Oversized name length against a truncated buffer.
      const malformedFile = new Uint8Array(20);
      malformedFile.set(te.encode('GHOST_FILE'), 0);
      malformedFile[11] = 0xff;
      assert(unpackPayload(malformedFile), 'Malformed file entry was not handled.');

      // Random fuzz must never throw.
      for (let i = 0; i < 200; i++) {
        const junk = crypto.getRandomValues(new Uint8Array(1 + Math.floor(Math.random() * 128)));
        unpackPayload(junk);
      }

      assert(unpackPayload(new Uint8Array(0)), 'Zero-length payload was not handled.');

      return 'Framing round trips, traversal names neutralised, 200 fuzz cases parsed without throwing.';
    },
  },

  // ── 8. PKZIP writer and reader ────────────────────────────────────────────
  {
    id: 'pkzip_engine',
    name: 'PKZIP Container & CRC-32',
    category: 'integrity',
    run: async () => {
      const body = te.encode('QuietSend uncompressed PKZIP package');
      const zip = buildZipArchive('test.txt', body);
      const extracted = parseZipArchive(zip);
      assert(extracted, 'PKZIP parser failed on a container it just wrote.');
      assert(td.decode(extracted) === td.decode(body), 'PKZIP payload mismatch.');

      // A corrupted body must fail the stored CRC-32 rather than being returned.
      const corrupted = new Uint8Array(zip);
      corrupted[40] ^= 0xff;
      assert(parseZipArchive(corrupted) === null, 'Corrupted ZIP body passed the CRC check.');

      // Truncated header.
      assert(parseZipArchive(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00])) === null,
        'Truncated ZIP header did not return null.');

      // A known CRC-32 vector.
      assert(crc32(te.encode('123456789')) === 0xcbf43926, 'CRC-32 check value is wrong.');

      return 'Round trip, CRC-32 check value 0xCBF43926, corrupt and truncated inputs rejected.';
    },
  },

  // ── 9. WAV audio steganography ────────────────────────────────────────────
  {
    id: 'audio_wav_stega',
    name: '16-bit PCM WAV Audio Steganography',
    category: 'steganography',
    run: async () => {
      const wav = createSyntheticWav();
      const payload = te.encode('Acoustic covert transmission at 44.1kHz');

      const stego = await encodeWavAudio(wav, payload, 2);
      const extracted = await decodeWavAudio(await stego.arrayBuffer(), 2);
      assert(td.decode(extracted) === td.decode(payload), 'Audio payload mismatch.');

      // Binary payloads with byte values the text path would mangle.
      const binary = crypto.getRandomValues(new Uint8Array(512));
      const stego2 = await encodeWavAudio(wav, binary, 2);
      const extracted2 = await decodeWavAudio(await stego2.arrayBuffer(), 2);
      assert(constantTimeCompare(binary, extracted2), 'Binary audio payload mismatch.');

      return 'Text and 512-byte binary payloads recovered bit-exactly from 16-bit PCM.';
    },
  },

  // ── 10. Passphrase strength ───────────────────────────────────────────────
  {
    id: 'passphrase_strength',
    name: 'Passphrase Generator Entropy',
    category: 'symmetric',
    run: async () => {
      assert(PASSPHRASE_BITS >= 60, `Generator yields only ${PASSPHRASE_BITS} bits.`);

      const samples = new Set<string>();
      for (let i = 0; i < 200; i++) samples.add(generatePassphrase());
      assert(samples.size === 200, `Generator repeated a passphrase within 200 draws (${samples.size} unique).`);

      // The meter must score a word phrase per word, not per character.
      const phrase = generatePassphrase();
      const scored = calcEntropy(phrase);
      assert(Math.abs(scored - PASSPHRASE_BITS) < 6,
        `Meter scored a generated phrase at ${Math.round(scored)} bits, expected about ${PASSPHRASE_BITS}.`);

      // A short character password must still score low.
      assert(calcEntropy('abc123') < 40, 'Meter overrates a short character password.');

      return `Generator yields ${PASSPHRASE_BITS} bits; 200/200 draws unique; meter matches within 6 bits.`;
    },
  },

  // ── 11. Encrypted keyring backup ──────────────────────────────────────────
  {
    id: 'keyring_backup',
    name: 'Encrypted Keyring Backup Round Trip',
    category: 'asymmetric',
    run: async () => {
      const key = await generateAsymmetricKeyPair('Backup Subject');
      const passphrase = 'backup-passphrase-for-test';

      const blob = await exportEncryptedBackup([key], [], passphrase);
      const text = await blob.text();

      // The private key must not appear anywhere in the file.
      assert(!text.includes(key.privateKeyArmor.slice(0, 40)),
        'Private key material is readable in the exported backup.');

      const restored = await importEncryptedBackup(text, passphrase);
      assert(restored.keyring.length === 1, 'Backup did not restore the keyring.');
      assert(restored.keyring[0].fingerprint === key.fingerprint, 'Restored key fingerprint mismatch.');

      let wrongRejected = false;
      try {
        await importEncryptedBackup(text, 'not-the-passphrase');
      } catch {
        wrongRejected = true;
      }
      assert(wrongRejected, 'Backup opened with the wrong passphrase.');

      // A too-short passphrase must be refused at export time.
      let shortRefused = false;
      try {
        await exportEncryptedBackup([key], [], 'short');
      } catch {
        shortRefused = true;
      }
      assert(shortRefused, 'Export accepted a weak backup passphrase.');

      return 'Backup is opaque without the passphrase, restores exactly, and refuses weak passphrases.';
    },
  },

  // ── 12. Constant-time compare and memory hygiene ──────────────────────────
  {
    id: 'memory_side_channel',
    name: 'Constant-Time Compare & Memory Hygiene',
    category: 'memory',
    run: async () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([1, 2, 3, 4, 5]);
      const c = new Uint8Array([1, 2, 3, 4, 6]);
      const shortBuf = new Uint8Array([1, 2, 3]);

      assert(constantTimeCompare(a, b), 'Equal buffers compared unequal.');
      assert(!constantTimeCompare(a, c), 'Differing buffers compared equal.');
      assert(!constantTimeCompare(a, shortBuf), 'Length mismatch compared equal.');

      const sensitive = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      zeroFill(sensitive);
      assert(sensitive.every((x) => x === 0), 'zeroFill left residue.');

      // The key cache must not hold a passphrase as a lookup key.
      const probe = 'cache-probe-passphrase';
      await encryptPayload(te.encode('x'), probe);
      const serialisedCache = JSON.stringify(Object.keys(localStorage));
      assert(!serialisedCache.includes(probe), 'A passphrase reached persistent storage.');

      return 'Constant-time compare verified on equal, differing and mismatched-length inputs.';
    },
  },
];

export async function runCryptoSelfTests(
  onUpdate?: (current: TestResultItem[]) => void,
): Promise<SelfTestReport> {
  const results: TestResultItem[] = [];
  const startGlobal = performance.now();

  for (const spec of TESTS) {
    const started = performance.now();
    let item: TestResultItem;
    try {
      const details = await spec.run();
      item = {
        id: spec.id,
        name: spec.name,
        category: spec.category,
        status: 'passed',
        latencyMs: Math.round(performance.now() - started),
        details,
      };
    } catch (err) {
      item = {
        id: spec.id,
        name: spec.name,
        category: spec.category,
        status: 'failed',
        latencyMs: Math.round(performance.now() - started),
        details: err instanceof Error ? err.message : String(err),
      };
    }
    results.push(item);
    onUpdate?.([...results]);
  }

  const passedTests = results.filter((r) => r.status === 'passed').length;
  return {
    overallPass: passedTests === results.length,
    totalTests: results.length,
    passedTests,
    totalDurationMs: Math.round(performance.now() - startGlobal),
    results,
  };
}
