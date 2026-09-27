import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import SimpleReveal from '../components/SimpleReveal';
import { LanguageProvider } from '../contexts/LanguageContext';
import * as engine from '../services/stegaEngine';
import * as keys from '../services/asymmetricCrypto';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('Simple Reveal passes the empty password separately from saved private keys', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(keys, 'getStoredKeyring').mockReturnValue([
    { id: 'test', name: 'Test', privateKeyArmor: 'synthetic-private-key', publicKeyArmor: '', fingerprint: '', createdAt: 0 },
  ]);
  vi.spyOn(engine, 'readImageFile').mockResolvedValue({ src: 'blob:synthetic', w: 100, h: 100 });
  const decode = vi.spyOn(engine, 'decodeImage').mockResolvedValue({ type: 'text', content: 'Plaintext recovered' });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => { root.render(<LanguageProvider><SimpleReveal /></LanguageProvider>); });
    const input = host.querySelector('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [new File(['fixture'], 'carrier.png')] });
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
    const reveal = [...host.querySelectorAll('button')].find((button) => button.textContent?.includes('Extract & Reveal'))!;
    await act(async () => { reveal.click(); });
    expect(decode).toHaveBeenCalledWith('blob:synthetic', undefined, expect.any(Function), expect.any(AbortSignal), ['synthetic-private-key']);
    expect(host.textContent).toContain('Plaintext recovered');
    expect(host.textContent).not.toContain('Payload is encrypted:');
  } finally {
    await act(async () => { root.unmount(); });
    host.remove();
  }
});
