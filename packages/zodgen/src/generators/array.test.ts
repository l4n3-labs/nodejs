import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateArray } from './array.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [] };

const createRecursiveCtx = (
  schema: z.ZodType,
  generate: (s: z.ZodType, key?: string) => unknown,
  faker?: Faker,
): GenContext<unknown> =>
  createContext(schema, testConfig, [], 0, faker ?? createTestFaker(), generate as GenContext<unknown>['generate']);

const makeSimpleGenerate =
  (faker: Faker) =>
  (schema: z.ZodType, _key?: string): unknown => {
    const type = (schema as any)._zod.def.type as string;
    switch (type) {
      case 'string':
        return faker.string.alpha(5);
      case 'number':
        return faker.number.int({ min: 1, max: 100 });
      case 'boolean':
        return faker.datatype.boolean();
      case 'literal': {
        const values = (schema as any)._zod.def.values as unknown[];
        return values[0];
      }
      default:
        return null;
    }
  };

describe('generateArray', () => {
  it('generates an array of elements', () => {
    const schema = z.array(z.string());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('respects min_length constraint', () => {
    const schema = z.array(z.string()).min(5);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it('respects max_length constraint', () => {
    const schema = z.array(z.string()).max(2);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('respects length_equals constraint', () => {
    const schema = z.array(z.string()).length(4);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    expect(result.length).toBe(4);
  });

  it('generates string elements from element schema', () => {
    const schema = z.array(z.string());
    const faker = createTestFaker(7);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    for (const item of result) {
      expect(typeof item).toBe('string');
    }
  });

  it('generates number elements from element schema', () => {
    const schema = z.array(z.number()).length(3);
    const faker = createTestFaker(7);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    for (const item of result) {
      expect(typeof item).toBe('number');
    }
  });

  it('respects min and max together', () => {
    const schema = z.array(z.string()).min(2).max(5);
    for (let i = 0; i < 10; i++) {
      const faker = createTestFaker(i);
      const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
      const result = generateArray(ctx);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(5);
    }
  });

  it('generates 1-3 items by default with no constraints', () => {
    for (let i = 0; i < 10; i++) {
      const schema = z.array(z.number());
      const faker = createTestFaker(i);
      const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
      const result = generateArray(ctx);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.length).toBeLessThanOrEqual(3);
      z.string().or(z.number());
    }
  });
});
