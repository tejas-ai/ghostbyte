import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildGhostFile, buildGhostVault, decodeImage, decodePayload, encryptPayload, sealDualVault, unpackPayload } from '../services/stegaEngine';
import { DENSITY_BITS, embedChunks, type CapacityDensity } from '../services/bitCodec';
import { encryptWithPublicKey, generateAsymmetricKeyPair } from '../services/asymmetricCrypto';

const encode = (text: string) => new TextEncoder().encode(text);

function carrierPixels(payload: Uint8Array, density: CapacityDensity) {
  const pixels = new Uint8ClampedArray(128 * 128 * 4).fill(255);
  const stream = new Uint8Array(payload.length + 4);
  new DataView(stream.buffer).setUint32(0, payload.length, true);
  stream.set(payload, 4);
  embedChunks(pixels, stream, DENSITY_BITS[density]);
  vi.stubGlobal('Worker', undefined);
  vi.stubGlobal('createImageBitmap', undefined);
  vi.stubGlobal('Image', class {
    naturalWidth = 128;
    naturalHeight = 128;
    onload?: () => void;
    set src(_src: string) { queueMicrotask(() => this.onload?.()); }
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: () => {}, getImageData: () => ({ data: pixels }),
  } as unknown as CanvasRenderingContext2D);
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Reveal credentials and plaintext regression', () => {
  it.each(Object.keys(DENSITY_BITS) as CapacityDensity[])('reads plaintext at %s with a saved keyring and no password', async (density) => {
    carrierPixels(encode('No password needed 🔐'), density);
    const result = await decodeImage('fixture.png', undefined, undefined, undefined, ['unrelated-private-key']);
    expect(result).toMatchObject({ type: 'text', content: 'No password needed 🔐' });
    expect(result.authenticated).not.toBe(true);
  });

  it.each(['file', 'vault'] as const)('recovers a plaintext %s despite a leftover password', async (kind) => {
    const files = [{ name: 'demo.txt', data: encode('original bytes') }];
    const raw = kind === 'file' ? buildGhostFile(files[0].name, files[0].data) : buildGhostVault(files);
    const result = await decodePayload(raw, 'leftover-password', undefined, undefined, ['unrelated-key']);
    expect(result).toEqual(unpackPayload(raw));
    expect(result.authenticated).not.toBe(true);
  });

  it('authenticates AES only with the right password; stored keys do not substitute for it', async () => {
    const raw = await encryptPayload(encode('Private message'), 'correct-password');
    expect((await decodePayload(raw, undefined, undefined, undefined, ['unrelated-key'])).type).toBe('binary');
    await expect(decodePayload(raw, 'wrong-password')).rejects.toThrow('Incorrect passphrase');
    expect(await decodePayload(raw, 'correct-password')).toMatchObject({
      type: 'text', content: 'Private message', authenticated: true,
    });
    raw[raw.length - 1] ^= 1;
    await expect(decodePayload(raw, 'correct-password')).rejects.toThrow('Incorrect passphrase');
  });

  it('tries the matching saved identity even when it is not first', async () => {
    const first = await generateAsymmetricKeyPair('Unrelated test identity');
    const recipient = await generateAsymmetricKeyPair('Recipient test identity');
    const raw = await encryptWithPublicKey(encode('To the second identity'), recipient.publicKeyArmor);
    expect(await decodePayload(raw, undefined, undefined, undefined, [first.privateKeyArmor, recipient.privateKeyArmor]))
      .toMatchObject({ type: 'text', content: 'To the second identity', isAsymmetric: true, authenticated: true });
    await expect(decodePayload(raw, undefined, undefined, undefined, [first.privateKeyArmor])).rejects.toThrow('matching private key');
  });

  it('continues to open both authenticated dual-vault paths', async () => {
    const raw = await sealDualVault(encode('primary'), 'primary-pass', encode('decoy'), 'decoy-pass', 2048);
    expect(await decodePayload(raw, 'primary-pass')).toMatchObject({ type: 'text', content: 'primary', isDecoy: false, authenticated: true });
    expect(await decodePayload(raw, 'decoy-pass')).toMatchObject({ type: 'text', content: 'decoy', isDecoy: true, authenticated: true });
  });

  it('honors cancellation before interpreting a payload', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(decodePayload(encode('plain'), undefined, undefined, controller.signal)).rejects.toThrow('cancelled');
  });

  it('does not accept a file frame with trailing unaccounted bytes as a valid file', () => {
    const file = buildGhostFile('demo.bin', new Uint8Array([1, 2, 3]));
    expect(unpackPayload(new Uint8Array([...file, 123])).type).not.toBe('file');
  });
});
