import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { fixture } from '../fixture.js';

describe('invalid data generation', () => {
  it('generates invalid string that fails safeParse', () => {
    const schema = z.string().min(5);
    const result = fixture(schema, { seed: 42 }).invalid();
    expect(schema.safeParse(result).success).toBe(false);
  });

  it('generates invalid number that fails safeParse', () => {
    const schema = z.number().int();
    const result = fixture(schema, { seed: 42 }).invalid();
    expect(schema.safeParse(result).success).toBe(false);
  });

  it('generates invalid object that fails safeParse', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = fixture(schema, { seed: 42 }).invalid();
    expect(schema.safeParse(result).success).toBe(false);
  });

  it('generates invalid enum value', () => {
    const schema = z.enum(['a', 'b', 'c']);
    const result = fixture(schema, { seed: 42 }).invalid();
    expect(['a', 'b', 'c']).not.toContain(result);
  });

  it('generates invalid literal value', () => {
    const schema = z.literal('hello');
    const result = fixture(schema, { seed: 42 }).invalid();
    expect(result).not.toBe('hello');
  });

  it('invalidMany generates multiple invalid values', () => {
    const schema = z.string().min(5);
    const results = fixture(schema, { seed: 42 }).invalidMany(10);
    expect(results).toHaveLength(10);
    for (const r of results) {
      expect(schema.safeParse(r).success).toBe(false);
    }
  });

  it('seeded invalid generation is deterministic', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const a = fixture(schema, { seed: 42 }).invalid();
    const b = fixture(schema, { seed: 42 }).invalid();
    expect(a).toEqual(b);
  });

  it('generates invalid array that fails safeParse', () => {
    const schema = z.array(z.string()).min(3);
    const result = fixture(schema, { seed: 42 }).invalid();
    expect(schema.safeParse(result).success).toBe(false);
  });

  it('generates invalid boolean that fails safeParse', () => {
    const schema = z.boolean();
    const result = fixture(schema, { seed: 42 }).invalid();
    expect(schema.safeParse(result).success).toBe(false);
  });
});
