import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import { schemaDef } from '../schema-def.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateUnion } from './union.js';

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
  optionalRate: 0.8,
  nullRate: 0.2,
  derivations: [],
  traits: {},
  overrides: [],
  generators: {},
};

const createRecursiveCtx = (
  schema: z.ZodType,
  generate: <U>(s: z.ZodType<U>, key?: string) => U,
  faker?: Faker,
  depth = 0,
): GenContext<unknown, 'union'> =>
  createContext<unknown, 'union'>(schema, testConfig, [], depth, faker ?? createTestFaker(), generate);

const makeDispatch = (faker: Faker): any => {
  const dispatch = (schema: z.ZodType): unknown => {
    const def = schemaDef<{ type: string; values: unknown[]; shape: Record<string, z.ZodType> }>(schema);
    const { type } = def;
    const ctx = createContext(schema, testConfig, [], 0, faker, dispatch as any);
    switch (type) {
      case 'string':
        return faker.lorem.word();
      case 'number':
        return faker.number.int();
      case 'boolean':
        return faker.datatype.boolean();
      case 'literal':
        return def.values[0];
      case 'union':
        return generateUnion(ctx as any);
      case 'object': {
        const shape = def.shape as Record<string, z.ZodType>;
        return Object.fromEntries(Object.entries(shape).map(([k, s]) => [k, dispatch(s)]));
      }
      default:
        return null;
    }
  };
  return dispatch;
};

describe('generateUnion', () => {
  it('generates a value matching one of the union options', () => {
    const schema = z.union([z.literal('a'), z.literal('b'), z.literal('c')]);
    const faker = createTestFaker(42);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    const result = generateUnion(ctx);
    expect(['a', 'b', 'c']).toContain(result);
  });

  it('works with literal unions — generates one of the literals', () => {
    const schema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
    const faker = createTestFaker(10);
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 20 }, () => {
      const ctx = createRecursiveCtx(schema, dispatch, faker);
      return generateUnion(ctx);
    });
    for (const r of results) {
      expect([1, 2, 3]).toContain(r);
    }
  });

  it('works with schema unions (string | number)', () => {
    const schema = z.union([z.string(), z.number()]);
    const faker = createTestFaker(99);
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 20 }, () => {
      const ctx = createRecursiveCtx(schema, dispatch, faker);
      return generateUnion(ctx);
    });
    for (const r of results) {
      expect(typeof r === 'string' || typeof r === 'number').toBe(true);
    }
  });

  it('covers all options across many iterations', () => {
    const schema = z.union([z.literal('x'), z.literal('y')]);
    const faker = createTestFaker();
    const dispatch = makeDispatch(faker);
    const results = new Set(
      Array.from({ length: 50 }, () => {
        const ctx = createRecursiveCtx(schema, dispatch, faker);
        return generateUnion(ctx);
      }),
    );
    expect(results.has('x')).toBe(true);
    expect(results.has('y')).toBe(true);
  });
});
