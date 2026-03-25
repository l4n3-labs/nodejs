import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateDate } from './date.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [], generators: {} };

const stubGenerate = () => {
  throw new Error('not implemented');
};

const createTestCtx = (schema: z.ZodType, faker?: Faker): GenContext<unknown, 'date'> =>
  createContext<unknown, 'date'>(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

describe('generateDate', () => {
  it('returns a Date instance', () => {
    const result = generateDate(createTestCtx(z.date()));
    expect(result).toBeInstanceOf(Date);
  });

  it('is deterministic with seed', () => {
    const a = generateDate(createTestCtx(z.date(), createTestFaker(42)));
    const b = generateDate(createTestCtx(z.date(), createTestFaker(42)));
    expect(a.getTime()).toBe(b.getTime());
  });

  it('respects min date', () => {
    const minDate = new Date('2025-01-01T00:00:00.000Z');
    const result = generateDate(createTestCtx(z.date().min(minDate)));
    expect(result.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
  });

  it('respects max date', () => {
    const maxDate = new Date('2025-12-31T23:59:59.999Z');
    const result = generateDate(createTestCtx(z.date().max(maxDate)));
    expect(result.getTime()).toBeLessThanOrEqual(maxDate.getTime());
  });

  it('respects min and max dates together', () => {
    const from = new Date('2025-06-01T00:00:00.000Z');
    const to = new Date('2025-06-30T23:59:59.999Z');
    for (let i = 0; i < 5; i++) {
      const result = generateDate(createTestCtx(z.date().min(from).max(to)));
      expect(result.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(to.getTime());
    }
  });

  it('generates dates within the default range when unconstrained', () => {
    const defaultFrom = new Date('2000-01-01T00:00:00.000Z');
    const defaultTo = new Date('2030-12-31T23:59:59.999Z');
    for (let i = 0; i < 10; i++) {
      const result = generateDate(createTestCtx(z.date()));
      expect(result.getTime()).toBeGreaterThanOrEqual(defaultFrom.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(defaultTo.getTime());
    }
  });
});
