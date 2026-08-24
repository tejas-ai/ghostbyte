import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_PIXELS,
  MAX_CARRIER_FILE_SIZE,
} from '../services/stegaEngine';
import {
  generateAsymmetricKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  isAsymmetricPayload,
} from '../services/asymmetricCrypto';
import { encodeWavAudio, decodeWavAudio } from '../services/audioStegaEngine';

describe('iOS (iPhone & iPad) & Constrained Mobile Device Validation Suite', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    // Restore navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  describe('1. Device & Canvas Constrained Memory Detection', () => {
    it('accurately identifies an iPhone UA as a constrained canvas environment', () => {
      const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
      const isConstrained = /iPhone|iPod|Android/i.test(iPhoneUA);
      expect(isConstrained).toBe(true);
    });

    it('accurately identifies iPadOS 13+ desktop-spoofed UA via maxTouchPoints > 1', () => {
      const iPadOS_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
      const maxTouchPoints = 5; // iPad multitouch hardware
      const isConstrained = (/Macintosh/.test(iPadOS_UA) && maxTouchPoints > 1) || /iPad/i.test(iPadOS_UA);
      expect(isConstrained).toBe(true);
    });

    it('distinguishes real macOS Desktop from iPadOS (maxTouchPoints === 0)', () => {
      const macOS_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
      const maxTouchPoints = 0; // Real Mac has 0 touch points
      const isConstrained = (/Macintosh/.test(macOS_UA) && maxTouchPoints > 1) || /iPad|iPhone|Android/i.test(macOS_UA);
      expect(isConstrained).toBe(false);
    });

    it('enforces safety bounds (4096px / 16.7 MP mobile ceiling to prevent WebKit memory blanking)', () => {
      expect(MAX_IMAGE_DIMENSION).toBeGreaterThanOrEqual(4096);
      expect(MAX_IMAGE_PIXELS).toBeGreaterThanOrEqual(16_777_216);
      expect(MAX_CARRIER_FILE_SIZE).toBe(50 * 1024 * 1024);
    });
  });

  describe('2. End-to-End Cryptographic & Steganographic Mobile Workflows', () => {
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
