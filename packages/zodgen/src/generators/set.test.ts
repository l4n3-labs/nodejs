import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import { schemaDef } from '../schema-def.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateSet } from './set.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [], generators: {} };

const createRecursiveCtx = (
  schema: z.ZodType,
  generate: (s: z.ZodType, key?: string) => unknown,
  faker?: Faker,
): GenContext<unknown, 'set'> =>
  createContext<unknown, 'set'>(
    schema,
    testConfig,
    [],
    0,
    faker ?? createTestFaker(),
    generate as GenContext<unknown>['generate'],
  );

const makeSimpleGenerate =
  (faker: Faker) =>
  (schema: z.ZodType, _key?: string): unknown => {
    const { type } = schemaDef(schema);
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
      default:
        return null;
    }
  };

describe('generateSet', () => {
  it('returns a Set instance', () => {
    const schema = z.set(z.number());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateSet(ctx);
    expect(result).toBeInstanceOf(Set);
  });

  it('generates values matching the value type', () => {
    const schema = z.set(z.string());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateSet(ctx);
    for (const item of result) {
      expect(typeof item).toBe('string');
    }
  });

  it('all values in the set are unique', () => {
    const schema = z.set(z.number());
    const faker = createTestFaker(99);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateSet(ctx);
    const arr = [...result];
    const unique = new Set(arr);
    expect(unique.size).toBe(arr.length);
  });

  it('respects min_length', () => {
    const schema = z.set(z.number()).min(3);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateSet(ctx);
    expect(result.size).toBeGreaterThanOrEqual(3);
  });

  it('respects max_length', () => {
    const schema = z.set(z.number()).max(2);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateSet(ctx);
    expect(result.size).toBeLessThanOrEqual(2);
  });

  it('respects size_equals constraint', () => {
    const schema = z.set(z.number()).size(5);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateSet(ctx);
    expect(result.size).toBe(5);
  });

  it('throws when unable to generate enough unique values', () => {
    const schema = z.set(z.literal('x')).min(2);
    const faker = createTestFaker(1);
    const generate = (_s: z.ZodType, _key?: string): unknown => 'x';
    const ctx = createRecursiveCtx(schema, generate, faker);
    expect(() => generateSet(ctx)).toThrow();
  });

  it('throws with the expected error message when unique generation fails', () => {
    const schema = z.set(z.literal('x')).min(2);
    const faker = createTestFaker(1);
    const generate = (_s: z.ZodType, _key?: string): unknown => 'x';
    const ctx = createRecursiveCtx(schema, generate, faker);
    expect(() => generateSet(ctx)).toThrow('generateSet: could not generate 2 unique values after 100 retries');
  });
});
