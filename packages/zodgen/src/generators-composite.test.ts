import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from './context.js';
import { generateArray } from './generators/array.js';
import { generateMap } from './generators/map.js';
import { generateObject } from './generators/object.js';
import { generateRecord } from './generators/record.js';
import { generateSet } from './generators/set.js';
import { generateTemplateLiteral } from './generators/template-literal.js';
import { generateTuple } from './generators/tuple.js';
import type { GenContext, GeneratorConfig } from './types.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [] };

// For composite tests, we need a working generate stub that handles inner schemas
const createRecursiveCtx = (
  schema: z.ZodType,
  generate: (s: z.ZodType, key?: string) => unknown,
  faker?: Faker,
): GenContext<unknown> =>
  createContext(schema, testConfig, [], 0, faker ?? createTestFaker(), generate as GenContext<unknown>['generate']);

// A simple recursive generate function that handles primitives
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
    expect(typeof result['label']).toBe('string');
    expect(typeof result['count']).toBe('number');
  });
});

describe('generateArray', () => {
  it('generates an array of elements', () => {
    const schema = z.array(z.string());
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('respects min_length constraint', () => {
    const schema = z.array(z.string()).min(5);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it('respects max_length constraint', () => {
    const schema = z.array(z.string()).max(2);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('respects length_equals constraint', () => {
    const schema = z.array(z.string()).length(4);
    const faker = createTestFaker(1);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    expect(result.length).toBe(4);
  });

  it('generates string elements from element schema', () => {
    const schema = z.array(z.string());
    const faker = createTestFaker(7);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    for (const item of result) {
      expect(typeof item).toBe('string');
    }
  });

  it('generates number elements from element schema', () => {
    const schema = z.array(z.number()).length(3);
    const faker = createTestFaker(7);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateArray(ctx);
    for (const item of result) {
      expect(typeof item).toBe('number');
    }
  });
});

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
});

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
    // Use a seeded faker that generates varied numbers
    const faker = createTestFaker(99);
    const ctx = createRecursiveCtx(schema, makeSimpleGenerate(faker), faker);
    const result = generateSet(ctx);
    expect(result.size).toBe(result.size); // trivially true; uniqueness is the set's guarantee
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

  it('throws when unable to generate enough unique values', () => {
    // A literal schema can only produce one unique value
    const schema = z.set(z.literal('x')).min(2);
    const faker = createTestFaker(1);
    const generate = (_s: z.ZodType, _key?: string): unknown => 'x';
    const ctx = createRecursiveCtx(schema, generate, faker);
    expect(() => generateSet(ctx)).toThrow();
  });
});

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
});

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

describe('generateTemplateLiteral', () => {
  it('concatenates literal string parts', () => {
    // Build a simple template literal with only string parts via internal manipulation
    // We'll use z.templateLiteral and verify structure
    const schema = z.templateLiteral([z.literal('hello'), z.literal('-'), z.literal('world')]);
    const faker = createTestFaker(1);
    const generate = (s: z.ZodType, _key?: string): unknown => {
      const def = (s as any)._zod.def;
      if (def.type === 'literal') return def.values[0];
      return makeSimpleGenerate(faker)(s, _key);
    };
    const ctx = createRecursiveCtx(schema, generate, faker);
    const result = generateTemplateLiteral(ctx);
    expect(typeof result).toBe('string');
    expect(result).toContain('hello');
  });

  it('generates schema parts as strings', () => {
    const schema = z.templateLiteral([z.literal('user-'), z.number()]);
    const faker = createTestFaker(1);
    const generate = (s: z.ZodType, _key?: string): unknown => {
      const def = (s as any)._zod.def;
      if (def.type === 'literal') return def.values[0];
      if (def.type === 'number') return 42;
      return makeSimpleGenerate(faker)(s, _key);
    };
    const ctx = createRecursiveCtx(schema, generate, faker);
    const result = generateTemplateLiteral(ctx);
    expect(typeof result).toBe('string');
    expect(result).toContain('user-');
    expect(result).toContain('42');
  });

  it('returns a string result', () => {
    const schema = z.templateLiteral([z.literal('test')]);
    const faker = createTestFaker(1);
    const generate = (s: z.ZodType, _key?: string): unknown => {
      const def = (s as any)._zod.def;
      if (def.type === 'literal') return def.values[0];
      return null;
    };
    const ctx = createRecursiveCtx(schema, generate, faker);
    const result = generateTemplateLiteral(ctx);
    expect(typeof result).toBe('string');
  });
});
