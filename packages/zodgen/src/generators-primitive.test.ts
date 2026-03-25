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

const stubGenerate = () => {
  throw new Error('not implemented');
};

const createTestCtx = <T>(schema: z.ZodType<T>, faker?: Faker): GenContext<T> =>
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
    const result = generateString(createTestCtx(z.email()));
    expect(result).toContain('@');
  });

  it('returns a url for string_format url', () => {
    const result = generateString(createTestCtx(z.string().url()));
    expect(result).toMatch(/^https?:\/\//);
  });

  it('returns a uuid for string_format uuid', () => {
    const result = generateString(createTestCtx(z.uuid()));
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

  it('returns an IPv4 address for ipv4 format', () => {
    const result = generateString(createTestCtx(z.ipv4()));
    expect(result).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });

  it('returns an IPv6 address for ipv6 format', () => {
    const result = generateString(createTestCtx(z.ipv6()));
    expect(result).toMatch(/:/);
  });

  it('returns a cuid for cuid format', () => {
    const result = generateString(createTestCtx(z.cuid()));
    expect(result.startsWith('c')).toBe(true);
    expect(result.length).toBe(25);
  });

  it('returns a cuid2 for cuid2 format', () => {
    const result = generateString(createTestCtx(z.cuid2()));
    expect(result.length).toBe(24);
    expect(result).toMatch(/^[a-z0-9]+$/);
  });

  it('returns a ulid for ulid format', () => {
    const result = generateString(createTestCtx(z.ulid()));
    expect(result.length).toBe(26);
    expect(result).toMatch(/^[A-Z0-9]+$/);
  });

  it('returns a nanoid for nanoid format', () => {
    const result = generateString(createTestCtx(z.nanoid()));
    expect(result.length).toBe(21);
  });

  it('returns an emoji for emoji format', () => {
    const result = generateString(createTestCtx(z.emoji()));
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a base64 string for base64 format', () => {
    const result = generateString(createTestCtx(z.base64()));
    expect(typeof result).toBe('string');
    expect(result.length).toBe(12);
  });

  it('returns a base64url string for base64url format', () => {
    const result = generateString(createTestCtx(z.base64url()));
    expect(typeof result).toBe('string');
    expect(result.length).toBe(12);
  });

  it('returns an ISO datetime for datetime format', () => {
    const result = generateString(createTestCtx(z.iso.datetime()));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns a date string for date format', () => {
    const result = generateString(createTestCtx(z.iso.date()));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a time string for time format', () => {
    const result = generateString(createTestCtx(z.iso.time()));
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}/);
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

  it('respects exclusive min (gt)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().gt(5)));
      expect(result).toBeGreaterThan(5);
    }
  });

  it('respects exclusive max (lt)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateNumber(createTestCtx(z.number().lt(10)));
      expect(result).toBeLessThan(10);
    }
  });

  it('avoids -0 for multipleOf result', () => {
    const result = generateNumber(createTestCtx(z.number().int().multipleOf(5).min(0).max(0)));
    expect(Object.is(result, -0)).toBe(false);
    expect(result).toBe(0);
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

  it('respects exclusive min (gt)', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().gt(10n)));
      expect(result).toBeGreaterThan(10n);
    }
  });

  it('respects exclusive max (lt)', () => {
    for (let i = 0; i < 5; i++) {
      const result = generateBigInt(createTestCtx(z.bigint().lt(50n)));
      expect(result).toBeLessThan(50n);
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
