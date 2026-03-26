import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateBoolean } from './boolean.js';

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

const createTestCtx = (schema: z.ZodType, faker?: Faker): GenContext<unknown, 'boolean'> =>
  createContext<unknown, 'boolean'>(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

describe('generateBoolean', () => {
  it('returns a boolean', () => {
    const result = generateBoolean(createTestCtx(z.boolean()));
    expect(typeof result).toBe('boolean');
  });

  it('is deterministic with seed', () => {
    const a = generateBoolean(createTestCtx(z.boolean(), createTestFaker(42)));
    const b = generateBoolean(createTestCtx(z.boolean(), createTestFaker(42)));
    expect(a).toBe(b);
  });
});
