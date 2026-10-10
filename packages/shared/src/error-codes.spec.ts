import { ERROR_CODES } from './error-codes.js';

describe('ERROR_CODES', () => {
  it('maps every key to itself', () => {
    for (const [key, value] of Object.entries(ERROR_CODES)) {
      expect(value).toBe(key);
    }
  });
});
