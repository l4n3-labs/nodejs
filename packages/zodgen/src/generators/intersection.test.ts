import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateIntersection } from './intersection.js';

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

const makeDispatch = (faker: Faker): any => {
  const dispatch = (schema: z.ZodType): unknown => {
    const def = schema._zod.def as any;
    const type = def.type;
    switch (type) {
      case 'string':
        return faker.lorem.word();
      case 'number':
        return faker.number.int();
      case 'boolean':
        return faker.datatype.boolean();
      case 'literal':
        return def.values[0];
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
