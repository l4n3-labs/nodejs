import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from './context.js';
import { generateBigInt } from './generators/bigint.js';
import { generateBoolean } from './generators/boolean.js';
import { generateDate } from './generators/date.js';
import { generateEnum } from './generators/enum.js';
import { generateLiteral } from './generators/literal.js';
import { generateNumber } from './generators/number.js';
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
} from './generators/primitives.js';
import { generateString } from './generators/string.js';
import type { GenContext, GeneratorConfig } from './types.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [] };

const stubGenerate = (_s: z.ZodType, _key?: string): unknown => {
  throw new Error('not implemented');
};

const createTestCtx = (schema: z.ZodType, faker?: Faker): GenContext =>
  createContext(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

// --- generateString ---

describe('generateString', () => {
  it('returns a string', () => {
    const result = generateString(createTestCtx(z.string()));
    expect(typeof result).toBe('string');
  });

  it('is deterministic with seed', () => {
    const a = generateString(createTestCtx(z.string(), createTestFaker(42)));
    const b = generateString(createTestCtx(z.string(), createTestFaker(42)));
    expect(a).toBe(b);
  });

  it('respects min length', () => {
    const result = generateString(createTestCtx(z.string().min(10)));
    expect(result.length).toBeGreaterThanOrEqual(10);
  });

  it('respects max length', () => {
    const result = generateString(createTestCtx(z.string().max(5)));
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('respects min and max length', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateString(createTestCtx(z.string().min(3).max(7)));
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.length).toBeLessThanOrEqual(7);
    }
  });

  it('respects exact length', () => {
    const result = generateString(createTestCtx(z.string().length(8)));
    expect(result.length).toBe(8);
  });

  it('returns valid email for string_format email', () => {
    const result = generateString(createTestCtx(z.string().email()));
    expect(result).toContain('@');
  });

  it('returns a url for string_format url', () => {
    const result = generateString(createTestCtx(z.string().url()));
    expect(result).toMatch(/^https?:\/\//);
  });

  it('returns a uuid for string_format uuid', () => {
    const result = generateString(createTestCtx(z.string().uuid()));
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('starts with the given prefix', () => {
    const result = generateString(createTestCtx(z.string().startsWith('hello_')));
    expect(result.startsWith('hello_')).toBe(true);
  });

  it('ends with the given suffix', () => {
    const result = generateString(createTestCtx(z.string().endsWith('_world')));
    expect(result.endsWith('_world')).toBe(true);
  });

  it('includes the given substring', () => {
    const result = generateString(createTestCtx(z.string().includes('foo')));
    expect(result).toContain('foo');
  });

  it('combines startsWith and endsWith', () => {
    const result = generateString(createTestCtx(z.string().startsWith('pre_').endsWith('_suf')));
    expect(result.startsWith('pre_')).toBe(true);
    expect(result.endsWith('_suf')).toBe(true);
  });
});

// --- generateNumber ---

describe('generateNumber', () => {
  it('returns a number', () => {
    const result = generateNumber(createTestCtx(z.number()));
    expect(typeof result).toBe('number');
  });

  it('is deterministic with seed', () => {
    const a = generateNumber(createTestCtx(z.number(), createTestFaker(42)));
    const b = generateNumber(createTestCtx(z.number(), createTestFaker(42)));
    expect(a).toBe(b);
  });

  it('respects min (inclusive)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().min(5)));
      expect(result).toBeGreaterThanOrEqual(5);
    }
  });

  it('respects max (inclusive)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().max(10)));
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it('respects int constraint', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().int()));
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('respects min and max together', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().min(1).max(10)));
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it('respects multipleOf', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().int().multipleOf(3)));
      expect(Math.abs(result % 3)).toBe(0);
    }
  });

  it('respects positive constraint', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().positive()));
      expect(result).toBeGreaterThan(0);
    }
  });

  it('respects negative constraint', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().negative()));
      expect(result).toBeLessThan(0);
    }
  });
});

// --- generateBoolean ---

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

// --- generateDate ---

describe('generateDate', () => {
  it('returns a Date instance', () => {
    const result = generateDate(createTestCtx(z.date()));
    expect(result).toBeInstanceOf(Date);
  });

  it('is deterministic with seed', () => {
    const a = generateDate(createTestCtx(z.date(), createTestFaker(42)));
    const b = generateDate(createTestCtx(z.date(), createTestFaker(42)));
    expect(a.getTime()).toBe(b.getTime());
  });

  it('respects min date', () => {
    const minDate = new Date('2025-01-01T00:00:00.000Z');
    const result = generateDate(createTestCtx(z.date().min(minDate)));
    expect(result.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
  });

  it('respects max date', () => {
    const maxDate = new Date('2025-12-31T23:59:59.999Z');
    const result = generateDate(createTestCtx(z.date().max(maxDate)));
    expect(result.getTime()).toBeLessThanOrEqual(maxDate.getTime());
  });

  it('respects min and max dates together', () => {
    const from = new Date('2025-06-01T00:00:00.000Z');
    const to = new Date('2025-06-30T23:59:59.999Z');
    for (let i = 0; i < 5; i++) {
      const result = generateDate(createTestCtx(z.date().min(from).max(to)));
      expect(result.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(to.getTime());
    }
  });
});

// --- generateBigInt ---

describe('generateBigInt', () => {
  it('returns a bigint', () => {
    const result = generateBigInt(createTestCtx(z.bigint()));
    expect(typeof result).toBe('bigint');
  });

  it('is deterministic with seed', () => {
    const a = generateBigInt(createTestCtx(z.bigint(), createTestFaker(42)));
    const b = generateBigInt(createTestCtx(z.bigint(), createTestFaker(42)));
    expect(a).toBe(b);
  });

  it('respects min (inclusive)', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().min(10n)));
      expect(result).toBeGreaterThanOrEqual(10n);
    }
  });

  it('respects max (inclusive)', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().max(50n)));
      expect(result).toBeLessThanOrEqual(50n);
    }
  });

  it('respects min and max together', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().min(5n).max(10n)));
      expect(result).toBeGreaterThanOrEqual(5n);
      expect(result).toBeLessThanOrEqual(10n);
    }
  });
});

// --- generateLiteral ---

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

// --- generateEnum ---

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

// --- primitives ---

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
