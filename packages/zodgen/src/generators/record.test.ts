import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import { schemaDef } from '../schema-def.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateRecord } from './record.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = {
  seed: undefined,
  maxDepth: 3,
  locale: [en, base],
  semanticFieldDetection: false,
  overrides: [],
  generators: {},
};

const createRecursiveCtx = (
  schema: z.ZodType,
  generate: (s: z.ZodType, key?: string) => unknown,
  faker?: Faker,
): GenContext<unknown, 'record'> =>
  createContext<unknown, 'record'>(
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

describe('generateRecord', () => {
  it('returns a plain object', () => {
    const schema = z.record(z.string(), z.number());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateRecord(ctx);
    expect(typeof result).toBe('object');
    expect(result).not.toBeInstanceOf(Map);
    expect(result).not.toBeInstanceOf(Set);
  });

  it('generates string keys and typed values', () => {
    const schema = z.record(z.string(), z.number());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateRecord(ctx) as Record<string, unknown>;
    for (const [k, v] of Object.entries(result)) {
      expect(typeof k).toBe('string');
      expect(typeof v).toBe('number');
    }
  });

  it('generates between 1 and 3 entries by default', () => {
    const schema = z.record(z.string(), z.boolean());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateRecord(ctx) as Record<string, unknown>;
    const entryCount = Object.keys(result).length;
    expect(entryCount).toBeGreaterThanOrEqual(1);
    expect(entryCount).toBeLessThanOrEqual(3);
  });
});
