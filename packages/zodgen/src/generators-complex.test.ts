import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from './context.js';
import { generateIntersection } from './generators/intersection.js';
import {
  generateCatch,
  generateDefault,
  generateNullable,
  generateOptional,
  generateReadonly,
} from './generators/nullable.js';
import { generateLazy, generatePipe, generatePromise } from './generators/recursive.js';
import { generateUnion } from './generators/union.js';
import type { GenContext, GeneratorConfig } from './types.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [] };

const createRecursiveCtx = <T>(
  schema: z.ZodType<T>,
  generate: <U>(s: z.ZodType<U>, key?: string) => U,
  faker?: Faker,
  depth = 0,
): GenContext<T> => createContext(schema, testConfig, [], depth, faker ?? createTestFaker(), generate);

// biome-ignore lint/suspicious/noExplicitAny: test dispatch handles all schema types dynamically
const makeDispatch = (faker: Faker): any => {
  const dispatch = (schema: z.ZodType): unknown => {
    // biome-ignore lint/suspicious/noExplicitAny: dynamic def access across all schema types
    const def = schema._zod.def as any;
    const type = def.type;
    // biome-ignore lint/suspicious/noExplicitAny: loosely typed test context
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
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generateUnion(ctx as any);
      case 'intersection':
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generateIntersection(ctx as any);
      case 'nullable':
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generateNullable(ctx as any);
      case 'optional':
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generateOptional(ctx as any);
      case 'default':
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generateDefault(ctx as any);
      case 'readonly':
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generateReadonly(ctx as any);
      case 'catch':
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generateCatch(ctx as any);
      case 'lazy':
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generateLazy(ctx as any);
      case 'promise':
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generatePromise(ctx as any);
      case 'pipe':
        // biome-ignore lint/suspicious/noExplicitAny: test utility
        return generatePipe(ctx as any);
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

describe('generateIntersection', () => {
  it('shallow merges left and right objects', () => {
    const left = z.object({ a: z.literal('left-a'), b: z.literal('left-b') });
    const right = z.object({ c: z.literal('right-c') });
    const schema = z.intersection(left, right);
    const faker = createTestFaker(1);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    const result = generateIntersection(ctx) as Record<string, unknown>;
    expect(result).toMatchObject({ a: 'left-a', b: 'left-b', c: 'right-c' });
  });

  it('right side wins on key conflict', () => {
    const left = z.object({ name: z.literal('from-left') });
    const right = z.object({ name: z.literal('from-right') });
    const schema = z.intersection(left, right);
    const faker = createTestFaker(2);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    const result = generateIntersection(ctx) as Record<string, unknown>;
    expect(result.name).toBe('from-right');
  });
});

describe('generateNullable', () => {
  it('generates inner value or null across 100 iterations (both must appear)', () => {
    const schema = z.nullable(z.literal('hello'));
    const faker = createTestFaker();
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 100 }, () => {
      const ctx = createRecursiveCtx(schema, dispatch, faker);
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
      const ctx = createRecursiveCtx(schema, dispatch, faker);
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
      const ctx = createRecursiveCtx(schema, dispatch, faker);
      return generateOptional(ctx);
    });
    expect(results).toContain('hello');
    expect(results).toContain(undefined);
  });
});

describe('generateDefault', () => {
  it('always generates the inner value (ignores the default)', () => {
    const schema = z.string().default('fallback');
    const faker = createTestFaker(5);
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 20 }, () => {
      const ctx = createRecursiveCtx(schema, dispatch, faker);
      return generateDefault(ctx);
    });
    for (const r of results) {
      expect(typeof r).toBe('string');
    }
  });
});

describe('generateReadonly', () => {
  it('returns a frozen object', () => {
    const schema = z.object({ x: z.literal(1) }).readonly();
    const faker = createTestFaker(6);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    const result = generateReadonly(ctx);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('generates the inner value', () => {
    const schema = z.object({ x: z.literal(42) }).readonly();
    const faker = createTestFaker(7);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    const result = generateReadonly(ctx) as Record<string, unknown>;
    expect(result.x).toBe(42);
  });
});

describe('generateCatch', () => {
  it('always generates the inner value (ignores the catch fallback)', () => {
    const schema = z.string().catch('fallback');
    const faker = createTestFaker(8);
    const dispatch = makeDispatch(faker);
    const results = Array.from({ length: 20 }, () => {
      const ctx = createRecursiveCtx(schema, dispatch, faker);
      return generateCatch(ctx);
    });
    for (const r of results) {
      expect(typeof r).toBe('string');
    }
  });
});

describe('generateLazy', () => {
  it('resolves the getter and generates the inner schema', () => {
    const schema = z.lazy(() => z.literal('lazy-value'));
    const faker = createTestFaker(9);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    const result = generateLazy(ctx);
    expect(result).toBe('lazy-value');
  });

  it('returns undefined at depth >= 3', () => {
    const schema = z.lazy(() => z.literal('deep'));
    const faker = createTestFaker(10);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker, 3);
    const result = generateLazy(ctx);
    expect(result).toBeUndefined();
  });

  it('still generates at depth 2 (below cutoff)', () => {
    const schema = z.lazy(() => z.literal('still-ok'));
    const faker = createTestFaker(11);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker, 2);
    const result = generateLazy(ctx);
    expect(result).toBe('still-ok');
  });
});

describe('generatePromise', () => {
  it('returns a Promise', async () => {
    const schema = z.promise(z.literal('promised'));
    const faker = createTestFaker(12);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    const result = generatePromise(ctx);
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toBe('promised');
  });

  it('wraps the generated inner value in Promise.resolve()', async () => {
    const schema = z.promise(z.number());
    const faker = createTestFaker(13);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    const result = await generatePromise(ctx);
    expect(typeof result).toBe('number');
  });
});

describe('generatePipe', () => {
  it('generates from the input schema (def.in)', () => {
    const schema = z.string().pipe(z.string().min(1));
    const faker = createTestFaker(14);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    const result = generatePipe(ctx);
    expect(typeof result).toBe('string');
  });

  it('generates from transform input — string.transform produces a pipe', () => {
    const schema = z.string().transform((s) => s.length);
    const faker = createTestFaker(15);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx(schema, dispatch, faker);
    // def.type === 'pipe', def.in is z.string()
    const def = (schema as any)._zod.def;
    expect(def.type).toBe('pipe');
    const result = generatePipe(ctx);
    expect(typeof result).toBe('string');
  });
});
