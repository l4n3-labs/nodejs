import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import { schemaDef } from '../schema-def.js';
import type { GenContext, GeneratorConfig, ZodDefType } from '../types.js';
import { generateLazy, generatePipe, generatePromise } from './recursive.js';

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
    const def = schemaDef<{ type: string; values: unknown[] }>(schema);
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
      case 'lazy':
        return generateLazy(ctx as any);
      case 'promise':
        return generatePromise(ctx as any);
      case 'pipe':
        return generatePipe(ctx as any);
      default:
        return null;
    }
  };
  return dispatch;
};

describe('generateLazy', () => {
  it('resolves the getter and generates the inner schema', () => {
    const schema = z.lazy(() => z.literal('lazy-value'));
    const faker = createTestFaker(9);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'lazy'>(schema, dispatch, faker);
    const result = generateLazy(ctx);
    expect(result).toBe('lazy-value');
  });

  it('returns undefined at depth >= 3', () => {
    const schema = z.lazy(() => z.literal('deep'));
    const faker = createTestFaker(10);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'lazy'>(schema, dispatch, faker, 3);
    const result = generateLazy(ctx);
    expect(result).toBeUndefined();
  });

  it('still generates at depth 2 (below cutoff)', () => {
    const schema = z.lazy(() => z.literal('still-ok'));
    const faker = createTestFaker(11);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'lazy'>(schema, dispatch, faker, 2);
    const result = generateLazy(ctx);
    expect(result).toBe('still-ok');
  });

  it('depth exactly 4 also returns undefined', () => {
    const schema = z.lazy(() => z.literal('deep'));
    const faker = createTestFaker(12);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'lazy'>(schema, dispatch, faker, 4);
    const result = generateLazy(ctx);
    expect(result).toBeUndefined();
  });
});

describe('generatePromise', () => {
  it('returns a Promise', async () => {
    const schema = z.promise(z.literal('promised'));
    const faker = createTestFaker(12);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'promise'>(schema, dispatch, faker);
    const result = generatePromise(ctx);
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toBe('promised');
  });

  it('wraps the generated inner value in Promise.resolve()', async () => {
    const schema = z.promise(z.number());
    const faker = createTestFaker(13);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'promise'>(schema, dispatch, faker);
    const result = await generatePromise(ctx);
    expect(typeof result).toBe('number');
  });

  it('resolved value type matches inner schema for strings', async () => {
    const schema = z.promise(z.string());
    const faker = createTestFaker(14);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'promise'>(schema, dispatch, faker);
    const result = await generatePromise(ctx);
    expect(typeof result).toBe('string');
  });
});

describe('generatePipe', () => {
  it('generates from the input schema (def.in)', () => {
    const schema = z.string().pipe(z.string().min(1));
    const faker = createTestFaker(14);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'pipe'>(schema, dispatch, faker);
    const result = generatePipe(ctx);
    expect(typeof result).toBe('string');
  });

  it('generates from transform input — string.transform produces a pipe', () => {
    const schema = z.string().transform((s) => s.length);
    const faker = createTestFaker(15);
    const dispatch = makeDispatch(faker);
    const ctx = createRecursiveCtx<'pipe'>(schema, dispatch, faker);
    // def.type === 'pipe', def.in is z.string()
    const def = schemaDef(schema);
    expect(def.type).toBe('pipe');
    const result = generatePipe(ctx);
    expect(typeof result).toBe('string');
  });
});
