import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig, ZodDefType } from '../types.js';
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

const testConfig: GeneratorConfig = { seed: undefined, overrides: [], generators: {} };

const stubGenerate = () => {
  throw new Error('not implemented');
};

const createTestCtx = <D extends ZodDefType>(schema: z.ZodType, faker?: Faker): GenContext<unknown, D> =>
  createContext<unknown, D>(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

describe('generateNull', () => {
  it('returns null', () => {
    expect(generateNull(createTestCtx<'null'>(z.null()))).toBeNull();
  });
});

describe('generateUndefined', () => {
  it('returns undefined', () => {
    expect(generateUndefined(createTestCtx<'undefined'>(z.undefined()))).toBeUndefined();
  });
});

describe('generateVoid', () => {
  it('returns undefined', () => {
    expect(generateVoid(createTestCtx<'void'>(z.void()))).toBeUndefined();
  });
});

describe('generateNaN', () => {
  it('returns NaN', () => {
    expect(generateNaN(createTestCtx<'nan'>(z.nan()))).toBeNaN();
  });
});

describe('generateNever', () => {
  it('throws', () => {
    expect(() => generateNever(createTestCtx<'never'>(z.never()))).toThrow('Cannot generate a value for z.never()');
  });
});

describe('generateUnknown', () => {
  it('returns null', () => {
    expect(generateUnknown(createTestCtx<'unknown'>(z.unknown()))).toBeNull();
  });
});

describe('generateAny', () => {
  it('returns null', () => {
    expect(generateAny(createTestCtx<'any'>(z.any()))).toBeNull();
  });
});

describe('generateSymbol', () => {
  it('returns a symbol', () => {
    expect(typeof generateSymbol(createTestCtx<'symbol'>(z.symbol()))).toBe('symbol');
  });
});

describe('generateCustom', () => {
  it('throws', () => {
    expect(() => generateCustom(createTestCtx<'custom'>(z.custom()))).toThrow(
      'Cannot generate a value for custom schemas',
    );
  });
});
