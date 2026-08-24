import { describe, it, expect } from 'vitest';
import { TESTS } from '../services/cryptoSelfTest';

describe('QuietSend Cryptographic & Bit-Packing Specifications', () => {
  TESTS.forEach((spec, index) => {
    it(`[Spec ${index + 1}/${TESTS.length}] [${spec.category.toUpperCase()}] ${spec.name}`, async () => {
      const details = await spec.run();
      expect(typeof details).toBe('string');
      expect(details.length).toBeGreaterThan(0);
    }, 30000);
  });
});
