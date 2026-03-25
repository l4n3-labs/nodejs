import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import { schemaDef } from '../schema-def.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateTemplateLiteral } from './template-literal.js';

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
): GenContext<unknown, 'template_literal'> =>
  createContext<unknown, 'template_literal'>(
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

describe('generateTemplateLiteral', () => {
  it('concatenates literal string parts', () => {
    const schema = z.templateLiteral([z.literal('hello'), z.literal('-'), z.literal('world')]);
    const faker = createTestFaker(1);
    const generate = (s: z.ZodType, _key?: string): unknown => {
      const def = schemaDef<{ type: string; values: unknown[] }>(s);
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
      const def = schemaDef<{ type: string; values: unknown[] }>(s);
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
      const def = schemaDef<{ type: string; values: unknown[] }>(s);
      if (def.type === 'literal') return def.values[0];
      return null;
    };
    const ctx = createRecursiveCtx(schema, generate, faker);
    const result = generateTemplateLiteral(ctx);
    expect(typeof result).toBe('string');
  });

  it('handles raw string parts mixed with schema parts', () => {
    const schema = z.templateLiteral(['hello-', z.number(), '-world']);
    const faker = createTestFaker(1);
    const generate = makeSimpleGenerate(faker);
    const ctx = createRecursiveCtx(schema, generate, faker);
    const result = generateTemplateLiteral(ctx);
    expect(result).toMatch(/^hello-\d+-world$/);
  });
});
