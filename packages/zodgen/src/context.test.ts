import { faker } from '@faker-js/faker';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod/v4';
import { createCheckSet, createContext } from './context.js';
import type { GeneratorConfig } from './types.js';

const defaultConfig = {
  seed: undefined,
  overrides: [],
} satisfies GeneratorConfig;

// Helper to extract raw check objects from a schema
const getRawChecks = (schema: z.ZodType): ReadonlyArray<unknown> => {
  const def = (schema as any)._zod.def as { checks?: unknown[] };
  return Array.isArray(def.checks) ? def.checks : [];
};

describe('createCheckSet', () => {
  describe('has()', () => {
    it('returns true for an existing check', () => {
      const schema = z.string().min(3);
      const checks = createCheckSet(getRawChecks(schema));
      expect(checks.has('min_length')).toBe(true);
    });

    it('returns false for a missing check', () => {
      const schema = z.string().min(3);
      const checks = createCheckSet(getRawChecks(schema));
      expect(checks.has('max_length')).toBe(false);
    });

    it('returns false for all checks when schema has no constraints', () => {
      const schema = z.string();
      const checks = createCheckSet(getRawChecks(schema));
      expect(checks.has('min_length')).toBe(false);
      expect(checks.has('string_format')).toBe(false);
    });
  });

  describe('find()', () => {
    it('returns the check def when the check is found', () => {
      const schema = z.string().min(3);
      const checks = createCheckSet(getRawChecks(schema));
      const def = checks.find('min_length');
      expect(def).toBeDefined();
      expect(def?.check).toBe('min_length');
      expect(def?.minimum).toBe(3);
    });

    it('returns undefined when the check is not found', () => {
      const schema = z.string().min(3);
      const checks = createCheckSet(getRawChecks(schema));
      expect(checks.find('max_length')).toBeUndefined();
    });

    it('returns string_format check with correct format for email', () => {
      const schema = z.string().email();
      const checks = createCheckSet(getRawChecks(schema));
      const def = checks.find('string_format');
      expect(def).toBeDefined();
      expect(def?.check).toBe('string_format');
      expect(def?.format).toBe('email');
    });

    it('returns greater_than check with correct fields for number min', () => {
      const schema = z.number().min(5);
      const checks = createCheckSet(getRawChecks(schema));
      const def = checks.find('greater_than');
      expect(def).toBeDefined();
      expect(def?.check).toBe('greater_than');
      expect(def?.value).toBe(5);
      expect(def?.inclusive).toBe(true);
    });
  });

  describe('all()', () => {
    it('returns all check defs', () => {
      const schema = z.string().min(3).max(10);
      const checks = createCheckSet(getRawChecks(schema));
      const all = checks.all();
      expect(all).toHaveLength(2);
      const checkNames = all.map((d) => d.check);
      expect(checkNames).toContain('min_length');
      expect(checkNames).toContain('max_length');
    });

    it('returns empty array when schema has no constraints', () => {
      const schema = z.string();
      const checks = createCheckSet(getRawChecks(schema));
      expect(checks.all()).toHaveLength(0);
    });

    it('returns correct defs for each check', () => {
      const schema = z.string().min(2).max(8);
      const checks = createCheckSet(getRawChecks(schema));
      const all = checks.all();
      const minDef = all.find((d) => d.check === 'min_length');
      const maxDef = all.find((d) => d.check === 'max_length');
      expect(minDef?.minimum).toBe(2);
      expect(maxDef?.maximum).toBe(8);
    });
  });
});

describe('createContext', () => {
  it('creates context with correct path, depth, faker, and config', () => {
    const schema = z.string();
    const path = ['user', 'name'];
    const depth = 2;
    const generate = vi.fn();

    const ctx = createContext(schema, defaultConfig, path, depth, faker, generate);

    expect(ctx.schema).toBe(schema);
    expect(ctx.path).toEqual(['user', 'name']);
    expect(ctx.depth).toBe(2);
    expect(ctx.faker).toBe(faker);
    expect(ctx.config).toBe(defaultConfig);
  });

  it('passes the generate function through unchanged', () => {
    const schema = z.string();
    const generate = vi.fn().mockReturnValue('hello');
    const ctx = createContext(schema, defaultConfig, [], 0, faker, generate);

    const result = ctx.generate(schema);
    expect(generate).toHaveBeenCalledWith(schema);
    expect(result).toBe('hello');
  });

  it('creates a CheckSet from the schema checks', () => {
    const schema = z.string().min(5);
    const ctx = createContext(schema, defaultConfig, [], 0, faker, vi.fn());

    expect(ctx.checks.has('min_length')).toBe(true);
    expect(ctx.checks.has('max_length')).toBe(false);
    const def = ctx.checks.find('min_length');
    expect(def?.minimum).toBe(5);
  });

  it('creates a CheckSet with empty checks for unconstrained schema', () => {
    const schema = z.number();
    const ctx = createContext(schema, defaultConfig, [], 0, faker, vi.fn());

    expect(ctx.checks.all()).toHaveLength(0);
    expect(ctx.checks.has('greater_than')).toBe(false);
  });
});
