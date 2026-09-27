import { describe, it, expect } from 'vitest';
import {
  encodeHoneyVault,
  sealDualVault,
  openContainer,
  unpackPayload,
  buildGhostVault,
  buildGhostFile,
  encryptPayload,
  calcSha256,
  crc32,
  buildZipArchive,
  parseZipArchive,
  sanitizeFilename,
} from '../services/stegaEngine';
import {
  generateAsymmetricKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  isAsymmetricPayload,
} from '../services/asymmetricCrypto';
import { encodeWavAudio, decodeWavAudio } from '../services/audioStegaEngine';
import { embedChunks, extractBits } from '../services/bitCodec';

describe('iOS (iPhone & iPad) & Constrained Mobile Device Validation Suite', () => {
  describe('2. End-to-End Cryptographic & Steganographic Mobile Workflows', () => {
    it('rejects random NUL-heavy bitstreams instead of presenting them as plaintext', () => {
      const randomCarrierBits = new Uint8Array(128);
      expect(unpackPayload(randomCarrierBits).type).toBe('binary');
    });

    it('rejects unsigned length headers larger than the carrier without allocating', () => {
      const pixels = new Uint8ClampedArray(128);
      embedChunks(pixels, new Uint8Array([0, 0, 0, 128]), 2);
      expect(extractBits(pixels, 96, 2)).toBeNull();
    });

    it('preserves messages made entirely of Unicode supplementary characters', () => {
      const message = '🔐🦊🚀';
      expect(unpackPayload(new TextEncoder().encode(message))).toMatchObject({ type: 'text', content: message });
    });

    it('rejects oversized and truncated archives instead of returning partial files', () => {
      const files = Array.from({ length: 501 }, (_, i) => ({ name: `${i}.txt`, data: new Uint8Array([1]) }));
      expect(() => buildGhostVault(files)).toThrow('500');
      const archive = buildGhostVault(files.slice(0, 2));
      expect(unpackPayload(archive.slice(0, -1)).type).toBe('binary');
    });

    it('keeps Unicode filenames within the decoder byte bound', () => {
      const safeName = sanitizeFilename('测'.repeat(180) + '.txt');
      expect(new TextEncoder().encode(safeName).length).toBeLessThanOrEqual(512);
      expect(unpackPayload(buildGhostFile(safeName, new Uint8Array([1, 2, 3])).slice()).type).toBe('file');
    });

    it('builds a valid multi-file ZIP while preserving the existing single-file parser', () => {
      const first = new TextEncoder().encode('first');
      const archive = buildZipArchive([
        { filename: 'first.txt', data: first },
        { filename: 'second.txt', data: new TextEncoder().encode('second') },
      ]);
      expect(new DataView(archive.buffer).getUint32(0, true)).toBe(0x04034b50);
      expect(new TextDecoder().decode(parseZipArchive(archive)!)).toBe('first');
      expect(new DataView(archive.buffer).getUint16(archive.length - 14, true)).toBe(2);
    });

    it('encodes and decodes GhostVault multi-file archives on mobile simulated buffers', async () => {
      const te = new TextEncoder();
      const files = [
        { name: 'manifest.json', data: te.encode('{"version":"3.0.0","airgap":true}') },
        { name: 'evidence.txt', data: te.encode('Classified whistleblower report payload.') },
      ];

      const packedVault = buildGhostVault(files);
      expect(packedVault.length).toBeGreaterThan(0);

      const passphrase = 'Mobile-Device-Test-Passphrase-2026!';
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Test openContainer parsing
      const opened = await openContainer(
        await (async () => {
          // Encrypt single container
          const pwBytes = te.encode(passphrase);
          const keyMaterial = await crypto.subtle.importKey('raw', pwBytes, 'PBKDF2', false, ['deriveKey']);
          const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt'],
          );
          const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, packedVault);
          const out = new Uint8Array(16 + 12 + ct.byteLength);
          out.set(salt, 0);
          out.set(iv, 16);
          out.set(new Uint8Array(ct), 28);
          return out;
        })(),
        passphrase,
      );

      expect(opened.type).toBe('vault');
      if (opened.type === 'vault') {
        expect(opened.files.length).toBe(2);
        expect(opened.files[0].name).toBe('manifest.json');
        expect(new TextDecoder().decode(opened.files[0].data)).toContain('airgap');
      }
    });

    it('performs full 16-bit PCM WAV audio steganography encode/decode round trip', async () => {
      // 1. Synthesize a 1-second 16-bit 44.1kHz stereo PCM WAV
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

      let off = 44;
      for (let i = 0; i < numSamples; i++) {
        const sample = Math.floor(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 8000);
        view.setInt16(off, sample, true);
        view.setInt16(off + 2, sample, true);
        off += 4;
      }

      const te = new TextEncoder();
      const secretText = 'QuietSend Audio Stego Verified on iPhone Safari';
      const encryptedPayload = await encryptPayload(te.encode(secretText), 'Audio-Key-12345');
      const encodedWavBlob = await encodeWavAudio(buf, encryptedPayload, 2);
      const encodedWavBuf = await encodedWavBlob.arrayBuffer();
      expect(encodedWavBuf.byteLength).toBe(buf.byteLength);

      const extractedPayload = await decodeWavAudio(encodedWavBuf, 2);
      const decrypted = await openContainer(extractedPayload, 'Audio-Key-12345');
      expect(decrypted.type).toBe('text');
      if (decrypted.type === 'text') {
        expect(decrypted.content).toBe(secretText);
      }
    });

    it('performs asymmetric ECDH P-256 key generation, encryption, and decryption', async () => {
      const keypair = await generateAsymmetricKeyPair('iPhone-Device-Identity');
      expect(keypair.publicKeyArmor).toContain('BEGIN QUIETSEND PUBLIC KEY');
      expect(keypair.privateKeyArmor).toBeTruthy();

      const message = new TextEncoder().encode('Confidential field dispatch message for iPhone recipient.');
      const envelope = await encryptWithPublicKey(message, keypair.publicKeyArmor);
      expect(isAsymmetricPayload(envelope)).toBe(true);

      const plaintext = await decryptWithPrivateKey(envelope, keypair.privateKeyArmor);
      expect(new TextDecoder().decode(plaintext)).toBe('Confidential field dispatch message for iPhone recipient.');
    });
  });
});
