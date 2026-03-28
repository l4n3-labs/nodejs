import { describe, expect, it } from 'vitest';
import { spacingTokens } from './spacing.js';

describe('spacingTokens', () => {
  it('has the expected scale keys', () => {
    const expectedKeys = ['0', '1', '2', '4', '8', '12', '16', '20', '24', '32', '40', '48', '64'];
    expect(Object.keys(spacingTokens)).toEqual(expectedKeys);
  });

  it('each token has a px value and dimension type', () => {
    for (const [key, token] of Object.entries(spacingTokens)) {
      const t = token as { $value: string; $type: string };
      expect(t.$value).toBe(`${key}px`);
      expect(t.$type).toBe('dimension');
    }
  });
});
