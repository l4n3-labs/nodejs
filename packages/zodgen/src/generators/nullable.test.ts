import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import { schemaDef } from '../schema-def.js';
import type { GenContext, GeneratorConfig, ZodDefType } from '../types.js';
import { generateCatch, generateDefault, generateNullable, generateOptional, generateReadonly } from './nullable.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [], generators: {} };

const createRecursiveCtx = <D extends ZodDefType>(
  schema: z.ZodType,
  generate: <U>(s: z.ZodType<U>, key?: string) => U,
  faker?: Faker,
  depth = 0,
): GenContext<unknown, D> =>
  createContext<unknown, D>(schema, testConfig, [], depth, faker ?? createTestFaker(), generate);

const makeDispatch = (faker: Faker): any => {
  const dispatch = (schema: z.ZodType): unknown => {
    const def = schemaDef<{ type: string; values: unknown[]; shape: Record<string, z.ZodType>; element: z.ZodType }>(
      schema,
    );
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
      case 'nullable':
        return generateNullable(ctx as any);
      case 'optional':
        return generateOptional(ctx as any);
      case 'default':
        return generateDefault(ctx as any);
      case 'readonly':
        return generateReadonly(ctx as any);
      case 'catch':
        return generateCatch(ctx as any);
      case 'object': {
        const shape = def.shape as Record<string, z.ZodType>;
        return Object.fromEntries(Object.entries(shape).map(([k, s]) => [k, dispatch(s)]));
      }
      case 'array': {
        return Array.from({ length: 2 }, () => dispatch(def.element));
      }
      default:
        return null;
    }
  };
  return dispatch;
};

describe('generateNullable', () => {
  it('generates inner value or null across 100 iterations (both must appear)', () => {
    const schema = z.nullable(z.literal('hello'));
    const faker = createTestFaker();
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 100 }, () => {
      const ctx = createRecursiveCtx<'nullable'>(schema, dispatch, faker);
      return generateNullable(ctx);
    });
    expect(results).toContain('hello');
    expect(results).toContain(null);
  });

  it('generates inner value approximately 80% of the time', () => {
    const schema = z.nullable(z.literal('val'));
    const faker = createTestFaker();
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 200 }, () => {
      const ctx = createRecursiveCtx<'nullable'>(schema, dispatch, faker);
      return generateNullable(ctx);
    });
    const nonNullCount = results.filter((r) => r !== null).length;
    // 80% target, allow generous tolerance
    expect(nonNullCount).toBeGreaterThan(100);
    expect(nonNullCount).toBeLessThan(200);
  });
});

describe('generateOptional', () => {
  it('generates inner value or undefined across 100 iterations (both must appear)', () => {
    const schema = z.optional(z.literal('hello'));
    const faker = createTestFaker();
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 100 }, () => {
      const ctx = createRecursiveCtx<'optional'>(schema, dispatch, faker);
      return generateOptional(ctx);
    });
    expect(results).toContain('hello');
    expect(results).toContain(undefined);
  });

  it('generates inner value approximately 80% of the time', () => {
    const schema = z.optional(z.literal('val'));
    const faker = createTestFaker();
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 200 }, () => {
      const ctx = createRecursiveCtx<'optional'>(schema, dispatch, faker);
      return generateOptional(ctx);
    });
    const nonUndefinedCount = results.filter((r) => r !== undefined).length;
    expect(nonUndefinedCount).toBeGreaterThan(100);
    expect(nonUndefinedCount).toBeLessThan(200);
  });
});

describe('generateDefault', () => {
  it('always generates the inner value (ignores the default)', () => {
    const schema = z.string().default('fallback');
    const faker = createTestFaker(5);
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 20 }, () => {
      const ctx = createRecursiveCtx<'default'>(schema, dispatch, faker);
      return generateDefault(ctx);
    });
    for (const r of results) {
      expect(typeof r).toBe('string');
    }
  });

  it('return type matches inner schema for numbers', () => {
    const schema = z.number().default(0);
    const faker = createTestFaker(5);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'default'>(schema, dispatch, faker);
    const result = generateDefault(ctx);
    expect(typeof result).toBe('number');
  });
});

describe('generateReadonly', () => {
  it('returns a frozen object', () => {
    const schema = z.object({ x: z.literal(1) }).readonly();
    const faker = createTestFaker(6);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'readonly'>(schema, dispatch, faker);
    const result = generateReadonly(ctx);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('generates the inner value', () => {
    const schema = z.object({ x: z.literal(42) }).readonly();
    const faker = createTestFaker(7);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'readonly'>(schema, dispatch, faker);
    const result = generateReadonly(ctx) as Record<string, unknown>;
    expect(result.x).toBe(42);
  });

  it('frozen primitive array', () => {
    const schema = z.array(z.number()).readonly();
    const faker = createTestFaker(8);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'readonly'>(schema, dispatch, faker);
    const result = generateReadonly(ctx);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('generateCatch', () => {
  it('always generates the inner value (ignores the catch fallback)', () => {
    const schema = z.string().catch('fallback');
    const faker = createTestFaker(8);
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 20 }, () => {
      const ctx = createRecursiveCtx<'catch'>(schema, dispatch, faker);
      return generateCatch(ctx);
    });
    for (const r of results) {
      expect(typeof r).toBe('string');
    }
  });

  it('return type matches inner schema for numbers', () => {
    const schema = z.number().catch(0);
    const faker = createTestFaker(9);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'catch'>(schema, dispatch, faker);
    const result = generateCatch(ctx);
    expect(typeof result).toBe('number');
  });
});
