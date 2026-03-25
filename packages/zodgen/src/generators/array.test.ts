import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import { schemaDef } from '../schema-def.js';
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
): GenContext<unknown, 'array'> =>
  createContext<unknown, 'array'>(
    schema,
    testConfig,
    [],
    0,
    faker ?? createTestFaker(),
    generate as GenContext<unknown>['generate'],
  );

const makeSimpleGenerate = (faker: Faker) => {
  const generate = (schema: z.ZodType, _key?: string): unknown => {
    const type = schema._zod.def.type;
    switch (type) {
      case 'string':
        return faker.string.alpha(5);
      case 'number':
        return faker.number.int({ min: 1, max: 100 });
      case 'boolean':
        return faker.datatype.boolean();
      case 'literal': {
        const { values } = schemaDef<{ values: unknown[] }>(schema);
        return values[0];
      }
      case 'union': {
        const { options } = schemaDef<{ options: z.ZodType[] }>(schema);
        return generate(faker.helpers.arrayElement(options), _key);
      }
      default:
        return null;
    }
  };
  return generate;
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
    }
  });

  it('generates union elements with equal distribution for 2 options', () => {
    const schema = z.array(z.string().or(z.number())).length(100);
    const faker = createTestFaker(42);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    const strings = result.filter((item) => typeof item === 'string');
    const numbers = result.filter((item) => typeof item === 'number');
    expect(strings.length).toBeGreaterThan(0);
    expect(numbers.length).toBeGreaterThan(0);
    expect(strings.length).toBeGreaterThan(20);
    expect(numbers.length).toBeGreaterThan(20);
  });

  it('generates union elements with equal distribution for 3 options', () => {
    const schema = z.array(z.union([z.string(), z.number(), z.boolean()])).length(150);
    const faker = createTestFaker(42);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    const strings = result.filter((item) => typeof item === 'string');
    const numbers = result.filter((item) => typeof item === 'number');
    const booleans = result.filter((item) => typeof item === 'boolean');
    expect(strings.length).toBeGreaterThan(0);
    expect(numbers.length).toBeGreaterThan(0);
    expect(booleans.length).toBeGreaterThan(0);
    expect(strings.length).toBeGreaterThan(20);
    expect(numbers.length).toBeGreaterThan(20);
    expect(booleans.length).toBeGreaterThan(20);
  });
});
