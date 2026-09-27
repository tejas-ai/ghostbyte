import { describe, expect, it } from 'vitest';
import { calculateCapacity, AES_OVERHEAD_BYTES } from '../services/stegaEngine';
import { DENSITY_BITS, embedChunks, extractBits, type CapacityDensity } from '../services/bitCodec';

describe('Full carrier capacity', () => {
  it('fits the requested 127.15 MiB payload in a 10417 × 6668 carrier at maximum density', () => {
    const payload = Math.ceil(127.15 * 1024 * 1024) + AES_OVERHEAD_BYTES + 18 + 512;
    expect(calculateCapacity(10417, 6668, 'lsb2')).toBeLessThan(payload);
    expect(calculateCapacity(10417, 6668, 'lsb6')).toBeGreaterThan(payload);
    expect((calculateCapacity(10417, 6668, 'lsb6') / 1024 ** 2).toFixed(2)).toBe('149.05');
  });

  it.each(Object.keys(DENSITY_BITS) as CapacityDensity[])('round-trips a payload filling every usable byte at %s', (density) => {
    const w = 83, h = 67;
    const cap = calculateCapacity(w, h, density);
    const payload = Uint8Array.from({ length: cap }, (_, i) => i % 251);
    const stream = new Uint8Array(4 + payload.length);
    new DataView(stream.buffer).setUint32(0, payload.length, true);
    stream.set(payload, 4);
    const pixels = new Uint8ClampedArray(w * h * 4).fill(255);
    const bits = DENSITY_BITS[density];
    expect(embedChunks(pixels, stream, bits)).toBe(Math.ceil(stream.length * 8 / bits));
    expect(extractBits(pixels, w * h * 3, bits)).toEqual(payload);
  });
});
