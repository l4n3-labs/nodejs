import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import {
  generateAny,
  generateCustom,
  generateNaN,
  generateNever,
  generateNull,
  generateSymbol,
  generateUndefined,
  generateUnknown,
  generateVoid,
} from './primitives.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [] };

const stubGenerate = () => {
  throw new Error('not implemented');
};

const createTestCtx = <T>(schema: z.ZodType<T>, faker?: Faker): GenContext<T> =>
  createContext(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

describe('generateNull', () => {
  it('returns null', () => {
    expect(generateNull(createTestCtx(z.null()))).toBeNull();
  });
});

describe('generateUndefined', () => {
  it('returns undefined', () => {
    expect(generateUndefined(createTestCtx(z.undefined()))).toBeUndefined();
  });
});

describe('generateVoid', () => {
  it('returns undefined', () => {
    expect(generateVoid(createTestCtx(z.void()))).toBeUndefined();
  });
});

describe('generateNaN', () => {
  it('returns NaN', () => {
    expect(generateNaN(createTestCtx(z.nan()))).toBeNaN();
  });
});

describe('generateNever', () => {
  it('throws', () => {
    expect(() => generateNever(createTestCtx(z.never()))).toThrow('Cannot generate a value for z.never()');
  });
});

describe('generateUnknown', () => {
  it('returns null', () => {
    expect(generateUnknown(createTestCtx(z.unknown()))).toBeNull();
  });
});

describe('generateAny', () => {
  it('returns null', () => {
    expect(generateAny(createTestCtx(z.any()))).toBeNull();
  });
});

describe('generateSymbol', () => {
  it('returns a symbol', () => {
    expect(typeof generateSymbol(createTestCtx(z.symbol()))).toBe('symbol');
  });
});

describe('generateCustom', () => {
  it('throws', () => {
    expect(() => generateCustom(createTestCtx(z.custom()))).toThrow('Cannot generate a value for custom schemas');
  });
});
