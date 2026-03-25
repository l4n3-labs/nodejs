import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import { schemaDef } from '../schema-def.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateObject } from './object.js';

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
): GenContext<unknown, 'object'> =>
  createContext<unknown, 'object'>(
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

describe('generateObject', () => {
  it('generates an object with keys matching the shape', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const faker = createTestFaker(1);
    const generate = makeSimpleGenerate(faker);
    const ctx = createRecursiveCtx(schema, generate, faker);
    const result = generateObject(ctx);
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('age');
  });

  it('calls generate with each key for key-based overrides', () => {
    const schema = z.object({ name: z.string(), active: z.boolean() });
    const faker = createTestFaker(1);
    const calledKeys: string[] = [];
    const generate = (s: z.ZodType, key?: string): unknown => {
      if (key !== undefined) calledKeys.push(key);
      return makeSimpleGenerate(faker)(s, key);
    };
    const ctx = createRecursiveCtx(schema, generate, faker);
    generateObject(ctx);
    expect(calledKeys).toContain('name');
    expect(calledKeys).toContain('active');
  });

  it('returns an empty object for an empty shape', () => {
    const schema = z.object({});
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateObject(ctx);
    expect(result).toEqual({});
  });

  it('generates correct types for each field', () => {
    const schema = z.object({ label: z.string(), count: z.number() });
    const faker = createTestFaker(42);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateObject(ctx);
    expect(typeof result.label).toBe('string');
    expect(typeof result.count).toBe('number');
  });

  it('generates all fields for a large shape', () => {
    const schema = z.object({
      a: z.string(),
      b: z.number(),
      c: z.boolean(),
      d: z.string(),
      e: z.number(),
    });
    const faker = createTestFaker(10);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateObject(ctx);
    expect(Object.keys(result)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('preserves field order from the schema shape', () => {
    const schema = z.object({ z_field: z.string(), a_field: z.number(), m_field: z.boolean() });
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateObject(ctx);
    expect(Object.keys(result)).toEqual(['z_field', 'a_field', 'm_field']);
  });
});
