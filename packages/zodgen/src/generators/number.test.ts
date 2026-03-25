import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateNumber } from './number.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [], generators: {} };

const stubGenerate = () => {
  throw new Error('not implemented');
};

const createTestCtx = (schema: z.ZodType, faker?: Faker): GenContext<unknown, 'number'> =>
  createContext<unknown, 'number'>(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

describe('generateNumber', () => {
  it('returns a number', () => {
    const result = generateNumber(createTestCtx(z.number()));
    expect(typeof result).toBe('number');
  });

  it('is deterministic with seed', () => {
    const a = generateNumber(createTestCtx(z.number(), createTestFaker(42)));
    const b = generateNumber(createTestCtx(z.number(), createTestFaker(42)));
    expect(a).toBe(b);
  });

  it('respects min (inclusive)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().min(5)));
      expect(result).toBeGreaterThanOrEqual(5);
    }
  });

  it('respects max (inclusive)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().max(10)));
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it('respects int constraint', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().int()));
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('respects min and max together', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().min(1).max(10)));
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it('respects multipleOf', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().int().multipleOf(3)));
      expect(Math.abs(result % 3)).toBe(0);
    }
  });

  it('respects positive constraint', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().positive()));
      expect(result).toBeGreaterThan(0);
    }
  });

  it('respects negative constraint', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().negative()));
      expect(result).toBeLessThan(0);
    }
  });

  it('respects exclusive min (gt)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().gt(5)));
      expect(result).toBeGreaterThan(5);
    }
  });

  it('respects exclusive max (lt)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().lt(10)));
      expect(result).toBeLessThan(10);
    }
  });

  it('avoids -0 for multipleOf result', () => {
    const result = generateNumber(createTestCtx(z.number().int().multipleOf(5).min(0).max(0)));
    expect(Object.is(result, -0)).toBe(false);
    expect(result).toBe(0);
  });

  it('produces float output when int is not specified', () => {
    const results: number[] = [];
    for (let i = 0; i < 20; i++) {
      results.push(generateNumber(createTestCtx(z.number().min(0).max(100))));
    }
    expect(results.every(Number.isInteger)).toBe(false);
  });

  it('respects multipleOf with min/max range', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().int().multipleOf(7).min(10).max(50)));
      expect(result % 7).toBe(0);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(50);
    }
  });

  it('respects exclusive min with int (gt + int)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().int().gt(5)));
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThan(5);
    }
  });

  it('respects exclusive max with int (lt + int)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().int().lt(10)));
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeLessThan(10);
    }
  });

  it('respects safeint format', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().safe()));
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(Number.MIN_SAFE_INTEGER);
      expect(result).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
    }
  });
});
