import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateLiteral } from './literal.js';

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

const stubGenerate = () => {
  throw new Error('not implemented');
};

const createTestCtx = (schema: z.ZodType, faker?: Faker): GenContext<unknown, 'literal'> =>
  createContext<unknown, 'literal'>(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

describe('generateLiteral', () => {
  it('returns the literal string value', () => {
    const result = generateLiteral(createTestCtx(z.literal('hello')));
    expect(result).toBe('hello');
  });

  it('returns the literal number value', () => {
    const result = generateLiteral(createTestCtx(z.literal(42)));
    expect(result).toBe(42);
  });

  it('returns the literal boolean value', () => {
    const result = generateLiteral(createTestCtx(z.literal(true)));
    expect(result).toBe(true);
  });

  it('returns one of the values for a union literal', () => {
    const schema = z.literal(['a', 'b', 'c']);
    for (let i = 0; i < 10; i++) {
      const result = generateLiteral(createTestCtx(schema));
      expect(['a', 'b', 'c']).toContain(result);
    }
  });
});
