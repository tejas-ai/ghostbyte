import { afterEach, describe, expect, it, vi } from 'vitest';
import { encodeImage, readImageFile } from '../services/stegaEngine';

function mockDecoder(width: number, height: number, fail = false) {
  vi.stubGlobal('Image', class {
    naturalWidth = width;
    naturalHeight = height;
    onload?: () => void;
    onerror?: () => void;
    set src(_src: string) {
      queueMicrotask(() => fail ? this.onerror?.() : this.onload?.());
    }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Carrier uploads use browser capabilities instead of fixed app caps', () => {
  it.each([
    [128 * 1024 * 1024, 8193, 5462],
    [512 * 1024 * 1024, 12000, 8000],
  ])('accepts a %i-byte decoded image at its original %ix%i resolution', async (size, w, h) => {
    mockDecoder(w, h);
    const file = new File(['fixture'], 'large.png', { type: 'image/png' });
    // Decoding is mocked in this unit test; a real >128 MB BMP is tested in-browser.
    Object.defineProperty(file, 'size', { value: size });
    const readBuffer = vi.spyOn(file, 'arrayBuffer');
    const result = await readImageFile(file);
    expect(result).toMatchObject({ w, h });
    expect(result.src).toMatch(/^blob:/);
    expect(readBuffer).not.toHaveBeenCalled();
    URL.revokeObjectURL(result.src);
  });

  it('does not impose a smaller resolution cap on mobile', async () => {
    vi.stubGlobal('navigator', { userAgent: 'iPhone', maxTouchPoints: 5 });
    mockDecoder(9000, 5000);
    const result = await readImageFile(new File(['fixture'], 'mobile.png'));
    expect(result).toMatchObject({ w: 9000, h: 5000 });
    URL.revokeObjectURL(result.src);
  });

  it('still rejects invalid dimensions and releases its blob URL', async () => {
    mockDecoder(0, 100);
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    await expect(readImageFile(new File(['fixture'], 'invalid.png'))).rejects.toThrow('invalid dimensions');
    expect(revoke).toHaveBeenCalledOnce();
  });

  it('reports decode failure without reading an entire non-TIFF into memory again', async () => {
    mockDecoder(0, 0, true);
    const file = new File(['broken png'], 'broken.png', { type: 'image/png' });
    const readBuffer = vi.spyOn(file, 'arrayBuffer');
    await expect(readImageFile(file)).rejects.toThrow('could not be decoded');
    expect(readBuffer).not.toHaveBeenCalled();
  });

  it('rejects unavailable canvas allocation rather than leaving encoding stuck', async () => {
    mockDecoder(12000, 8000);
    vi.stubGlobal('createImageBitmap', undefined);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(encodeImage('blob:large-fixture', 'demo', '')).rejects.toThrow('more available memory');
  });
});
