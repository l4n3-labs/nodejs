import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { fixture } from '../fixture.js';

describe('semantic field name detection', () => {
  it('generates realistic first name for firstName field', () => {
    const schema = z.object({ firstName: z.string() });
    const result = fixture(schema, { seed: 42 }).one();
    expect(typeof result.firstName).toBe('string');
    expect(result.firstName.length).toBeGreaterThan(0);
    // Should not be random alpha — realistic names contain only letters
    expect(result.firstName).toMatch(/^[A-Za-z'-]+$/);
  });

  it('handles snake_case field names (first_name)', () => {
    const schema = z.object({ first_name: z.string() });
    const result = fixture(schema, { seed: 42 }).one();
    expect(result.first_name.length).toBeGreaterThan(0);
    expect(result.first_name).toMatch(/^[A-Za-z'-]+$/);
  });

  it('generates realistic city name', () => {
    const schema = z.object({ city: z.string() });
    const result = fixture(schema, { seed: 42 }).one();
    expect(result.city.length).toBeGreaterThan(0);
  });

  it('generates age in realistic range for number fields', () => {
    const schema = z.object({ age: z.number() });
    const results = fixture(schema, { seed: 42 }).many(20);
    for (const r of results) {
      expect(r.age).toBeGreaterThanOrEqual(18);
      expect(r.age).toBeLessThanOrEqual(80);
    }
  });

  it('still uses format generator for z.email() (not semantic)', () => {
    const schema = z.object({ email: z.email() });
    const result = fixture(schema, { seed: 42 }).one();
    expect(result.email).toContain('@');
  });

  it('does not apply semantic detection when string has length constraints', () => {
    const schema = z.object({ city: z.string().min(3).max(5) });
    const result = fixture(schema, { seed: 42 }).one();
    expect(result.city.length).toBeGreaterThanOrEqual(3);
    expect(result.city.length).toBeLessThanOrEqual(5);
  });

  it('does not apply semantic for numbers with explicit range constraints', () => {
    const schema = z.object({ price: z.number().min(0).max(100) });
    const results = fixture(schema, { seed: 42 }).many(20);
    for (const r of results) {
      expect(r.price).toBeGreaterThanOrEqual(0);
      expect(r.price).toBeLessThanOrEqual(100);
    }
  });

  it('can be disabled via semanticFieldDetection: false', () => {
    const schema = z.object({ firstName: z.string() });
    const withSemantic = fixture(schema, { seed: 42 }).one();
    const withoutSemantic = fixture(schema, { seed: 42, semanticFieldDetection: false }).one();
    // Without semantic, the firstName field gets random alpha, which differs from a real name
    expect(withSemantic.firstName).not.toBe(withoutSemantic.firstName);
  });

  it('explicit override takes priority over semantic detection', () => {
    const schema = z.object({ firstName: z.string() });
    const result = fixture(schema, { seed: 42 })
      .override('firstName', () => 'OVERRIDE')
      .one();
    expect(result.firstName).toBe('OVERRIDE');
  });
});
