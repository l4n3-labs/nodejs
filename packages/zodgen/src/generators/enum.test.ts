import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateEnum } from './enum.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [] };

const stubGenerate = () => {
  throw new Error('not implemented');
};

const createTestCtx = (schema: z.ZodType, faker?: Faker): GenContext<unknown, 'enum'> =>
  createContext<unknown, 'enum'>(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

describe('generateEnum', () => {
  it('returns one of the enum values', () => {
    const schema = z.enum(['red', 'green', 'blue']);
    for (let i = 0; i < 10; i++) {
      const result = generateEnum(createTestCtx(schema));
      expect(['red', 'green', 'blue']).toContain(result);
    }
  });

  it('is deterministic with seed', () => {
    const schema = z.enum(['a', 'b', 'c']);
    const a = generateEnum(createTestCtx(schema, createTestFaker(42)));
    const b = generateEnum(createTestCtx(schema, createTestFaker(42)));
    expect(a).toBe(b);
  });

  it('handles a single-value enum', () => {
    const schema = z.enum(['only']);
    const result = generateEnum(createTestCtx(schema));
    expect(result).toBe('only');
  });
});
