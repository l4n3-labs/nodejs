import { base, en, Faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { createContext } from '../context.js';
import type { GenContext, GeneratorConfig } from '../types.js';
import { generateString } from './string.js';

const createTestFaker = (seed?: number): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const testConfig: GeneratorConfig = { seed: undefined, overrides: [] };

const stubGenerate = () => {
  throw new Error('not implemented');
};

const createTestCtx = (schema: z.ZodType, faker?: Faker): GenContext<unknown, 'string'> =>
  createContext<unknown, 'string'>(schema, testConfig, [], 0, faker ?? createTestFaker(), stubGenerate);

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

  it('returns an IPv4 address for ip format', () => {
    // zod v4 does not expose z.string().ip() — construct a schema with the 'ip' format via ipv4
    // The generator switch treats 'ip' and 'ipv4' identically
    const result = generateString(createTestCtx(z.ipv4()));
    expect(result).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });

  it('includes combined with min length', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateString(createTestCtx(z.string().includes('foo').min(10)));
      expect(result).toContain('foo');
      expect(result.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('startsWith + endsWith + includes all at once', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateString(createTestCtx(z.string().startsWith('pre_').endsWith('_suf').includes('mid')));
      expect(result.startsWith('pre_')).toBe(true);
      expect(result.endsWith('_suf')).toBe(true);
      expect(result).toContain('mid');
    }
  });

  it('length_equals with startsWith', () => {
    const result = generateString(createTestCtx(z.string().startsWith('abc').length(10)));
    expect(result.startsWith('abc')).toBe(true);
    expect(result.length).toBe(10);
  });

  it('default string has length between 0 and 20', () => {
    for (let i = 0; i < 20; i++) {
      const result = generateString(createTestCtx(z.string()));
      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(result.length).toBeLessThanOrEqual(20);
    }
  });
});
