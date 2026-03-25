import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateTuple } from './tuple.js';

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

describe('generateTuple', () => {
  it('generates a tuple matching item schemas', () => {
    const schema = z.tuple([z.string(), z.number()]);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateTuple(ctx);
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('string');
    expect(typeof result[1]).toBe('number');
  });

  it('generates an empty tuple for empty items', () => {
    const schema = z.tuple([]);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateTuple(ctx);
    expect(result).toHaveLength(0);
  });

  it('generates rest elements when rest schema is present', () => {
    const schema = z.tuple([z.string()]).rest(z.number());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateTuple(ctx);
    // At least the required item, possibly more from rest
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(typeof result[0]).toBe('string');
    // Extra elements (rest) should be numbers
    for (const item of result.slice(1)) {
      expect(typeof item).toBe('number');
    }
  });

  it('generates no rest elements when rest is null', () => {
    const schema = z.tuple([z.string(), z.boolean()]);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateTuple(ctx);
    expect(result).toHaveLength(2);
  });

  it('generates a single-element tuple', () => {
    const schema = z.tuple([z.boolean()]);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateTuple(ctx);
    expect(result).toHaveLength(1);
    expect(typeof result[0]).toBe('boolean');
  });

  it('generates a three-element tuple with mixed types', () => {
    const schema = z.tuple([z.string(), z.number(), z.boolean()]);
    const faker = createTestFaker(42);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateTuple(ctx);
    expect(result).toHaveLength(3);
    expect(typeof result[0]).toBe('string');
    expect(typeof result[1]).toBe('number');
    expect(typeof result[2]).toBe('boolean');
  });
});
