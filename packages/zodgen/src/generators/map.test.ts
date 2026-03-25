import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import { schemaDef } from '../schema-def.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateMap } from './map.js';

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
): GenContext<unknown, 'map'> =>
  createContext<unknown, 'map'>(
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

describe('generateMap', () => {
  it('returns a Map instance', () => {
    const schema = z.map(z.string(), z.number());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateMap(ctx);
    expect(result).toBeInstanceOf(Map);
  });

  it('generates keys and values matching their schemas', () => {
    const schema = z.map(z.string(), z.number());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateMap(ctx);
    for (const [k, v] of result) {
      expect(typeof k).toBe('string');
      expect(typeof v).toBe('number');
    }
  });

  it('generates between 1 and 3 entries by default', () => {
    const schema = z.map(z.string(), z.number());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateMap(ctx);
    expect(result.size).toBeGreaterThanOrEqual(1);
    expect(result.size).toBeLessThanOrEqual(3);
  });

  it('respects min_size constraint', () => {
    const schema = z.map(z.string(), z.number()).min(2);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateMap(ctx);
    expect(result.size).toBeGreaterThanOrEqual(2);
  });

  it('respects max_size constraint', () => {
    const schema = z.map(z.string(), z.number()).max(1);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateMap(ctx);
    expect(result.size).toBeLessThanOrEqual(1);
  });

  it('respects min_size and max_size together', () => {
    const schema = z.map(z.string(), z.number()).min(2).max(4);
    for (let i = 0; i < 10; i++) {
      const faker = createTestFaker(i);
      const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
      const result = generateMap(ctx);
      expect(result.size).toBeGreaterThanOrEqual(2);
      expect(result.size).toBeLessThanOrEqual(4);
    }
  });
});
