import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateBigInt } from './bigint.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [] };

const stubGenerate = () => {
  throw new Error('not implemented');
};

const createTestCtx = (schema: z.ZodType, faker?: Faker): GenContext<unknown, 'bigint'> =>
  createContext<unknown, 'bigint'>(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

describe('generateBigInt', () => {
  it('returns a bigint', () => {
    const result = generateBigInt(createTestCtx(z.bigint()));
    expect(typeof result).toBe('bigint');
  });

  it('is deterministic with seed', () => {
    const a = generateBigInt(createTestCtx(z.bigint(), createTestFaker(42)));
    const b = generateBigInt(createTestCtx(z.bigint(), createTestFaker(42)));
    expect(a).toBe(b);
  });

  it('respects min (inclusive)', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().min(10n)));
      expect(result).toBeGreaterThanOrEqual(10n);
    }
  });

  it('respects max (inclusive)', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().max(50n)));
      expect(result).toBeLessThanOrEqual(50n);
    }
  });

  it('respects min and max together', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().min(5n).max(10n)));
      expect(result).toBeGreaterThanOrEqual(5n);
      expect(result).toBeLessThanOrEqual(10n);
    }
  });

  it('respects exclusive min (gt)', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().gt(10n)));
      expect(result).toBeGreaterThan(10n);
    }
  });

  it('respects exclusive max (lt)', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().lt(50n)));
      expect(result).toBeLessThan(50n);
    }
  });

  it('respects inclusive min and max together (.gte() and .lte())', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().gte(5n).lte(10n)));
      expect(result).toBeGreaterThanOrEqual(5n);
      expect(result).toBeLessThanOrEqual(10n);
    }
  });
});
