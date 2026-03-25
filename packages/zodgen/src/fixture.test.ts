import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { fixture } from './fixture.js';
import { override } from './transforms/override.js';
import { withSeed } from './transforms/seed.js';

describe('fixture()', () => {
  it('generates a value from a simple schema', () => {
    const result = fixture(z.string());
    expect(typeof result).toBe('string');
  });

  it('generates a full object', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number().min(18).max(99),
      role: z.enum(['admin', 'user']),
    });
    const result = fixture(schema);
    expect(typeof result.name).toBe('string');
    expect(result.email).toContain('@');
    expect(result.age).toBeGreaterThanOrEqual(18);
    expect(result.age).toBeLessThanOrEqual(99);
    expect(['admin', 'user']).toContain(result.role);
  });

  it('supports seeded determinism', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const a = fixture(schema, { seed: 42 });
    const b = fixture(schema, { seed: 42 });
    expect(a).toEqual(b);
  });
});

describe('fixture.many()', () => {
  it('generates correct count', () => {
    const results = fixture.many(z.string(), 5);
    expect(results).toHaveLength(5);
    for (const r of results) expect(typeof r).toBe('string');
  });

  it('generates varied values with seed', () => {
    const results = fixture.many(z.number(), 5, { seed: 42 });
    // With a shared faker, values should vary
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe('fixture.create()', () => {
  it('returns generator with one and many', () => {
    const gen = fixture.create(withSeed(42));
    const result = gen.one(z.string());
    expect(typeof result).toBe('string');
  });

  it('applies overrides', () => {
    const gen = fixture.create(override('email', () => 'custom@test.com'));
    const schema = z.object({ email: z.string().email() });
    const result = gen.one(schema);
    expect(result.email).toBe('custom@test.com');
  });

  it('many generates correct count', () => {
    const gen = fixture.create(withSeed(42));
    const results = gen.many(z.number(), 3);
    expect(results).toHaveLength(3);
  });

  it('first registered override wins', () => {
    const gen = fixture.create(
      override('name', () => 'First'),
      override('name', () => 'Second'),
    );
    const result = gen.one(z.object({ name: z.string() }));
    expect(result.name).toBe('First');
  });

  it('predicate override works', () => {
    const gen = fixture.create(
      override(
        (ctx) => ctx.checks.has('string_format') && ctx.checks.find('string_format')?.format === 'email',
        () => 'predicate@test.com',
      ),
    );
    const schema = z.object({ email: z.string().email(), name: z.string() });
    const result = gen.one(schema);
    expect(result.email).toBe('predicate@test.com');
    expect(typeof result.name).toBe('string');
  });
});

describe('override: real-world usage', () => {
  const AccountSchema = z.object({
    id: z.uuid(),
    name: z.string().max(255),
    type: z.string().nullable(),
    deleted: z.coerce.date().max(new Date()).nullable(),
    createdAt: z.coerce.date().max(new Date()),
    createdBy: z.email().nullable(),
    updatedAt: z.coerce.date().max(new Date()).nullable(),
    updatedBy: z.email().nullable(),
  });

  it('overrides a field to a fixed value via string matcher', () => {
    const gen = fixture.create(override('type', () => 'Partner'));
    const account = gen.one(AccountSchema);
    expect(account.type).toBe('Partner');
  });

  it('reuses generators with different overrides', () => {
    const partnerGen = fixture.create(override('type', () => 'Partner'));
    const vendorGen = fixture.create(override('type', () => 'Vendor'));
    expect(partnerGen.one(AccountSchema).type).toBe('Partner');
    expect(vendorGen.one(AccountSchema).type).toBe('Vendor');
  });

  it('applies custom null probability via predicate override', () => {
    const gen = fixture.create(
      override(
        (ctx) => ctx.path.at(-1) === 'deleted',
        (ctx) => (ctx.faker.number.float() < 0.15 ? null : ctx.faker.date.recent()),
      ),
    );
    const results = gen.many(AccountSchema, 200);
    const nullCount = results.filter((r) => r.deleted === null).length;
    const nonNullCount = results.filter((r) => r.deleted !== null).length;
    expect(nullCount).toBeGreaterThan(0);
    expect(nonNullCount).toBeGreaterThan(0);
    // ~15% null — allow 5-35% range for statistical tolerance
    expect(nullCount).toBeGreaterThan(10);
    expect(nullCount).toBeLessThan(70);
  });

  it('combines multiple overrides on the same schema', () => {
    const gen = fixture.create(
      override('type', () => 'Partner'),
      override(
        (ctx) => ctx.path.at(-1) === 'deleted',
        (ctx) => (ctx.faker.number.float() < 0.15 ? null : ctx.faker.date.recent()),
      ),
    );
    const results = gen.many(AccountSchema, 50);
    for (const account of results) {
      expect(account.type).toBe('Partner');
      expect(account.deleted === null || account.deleted instanceof Date).toBe(true);
    }
  });

  it('generates many fixtures for batch testing', () => {
    const gen = fixture.create(
      withSeed(42),
      override('type', () => 'Partner'),
    );
    const accounts = gen.many(AccountSchema, 10);
    expect(accounts).toHaveLength(10);
    for (const account of accounts) {
      expect(account.type).toBe('Partner');
      expect(account.id).toMatch(/^[0-9a-f]{8}-/);
    }
  });
});

describe('integration: nested schemas', () => {
  it('handles objects with arrays of objects', () => {
    const schema = z.object({
      users: z
        .array(
          z.object({
            name: z.string(),
            tags: z.array(z.string()),
          }),
        )
        .min(1)
        .max(3),
    });
    const result = fixture(schema);
    expect(result.users.length).toBeGreaterThanOrEqual(1);
    for (const user of result.users) {
      expect(typeof user.name).toBe('string');
      expect(Array.isArray(user.tags)).toBe(true);
    }
  });

  it('handles optional fields', () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
    });
    const result = fixture(schema);
    expect(typeof result.required).toBe('string');
  });

  it('handles nullable fields', () => {
    const schema = z.object({
      value: z.string().nullable(),
    });
    const result = fixture(schema);
    expect(result.value === null || typeof result.value === 'string').toBe(true);
  });

  it('handles recursive schemas with z.lazy()', () => {
    type Tree = { value: string; children: ReadonlyArray<Tree> };
    const treeSchema: z.ZodType<Tree> = z.object({
      value: z.string(),
      children: z.array(z.lazy(() => treeSchema)),
    });
    const result = fixture(treeSchema);
    expect(typeof result.value).toBe('string');
    expect(Array.isArray(result.children)).toBe(true);
  });

  it('throws for custom schemas with helpful message', () => {
    const schema = z.custom<string>();
    expect(() => fixture(schema)).toThrow(/override/);
  });

  it('handles enum schemas', () => {
    const schema = z.enum(['red', 'green', 'blue']);
    const result = fixture(schema);
    expect(['red', 'green', 'blue']).toContain(result);
  });

  it('handles literal schemas', () => {
    expect(fixture(z.literal('hello'))).toBe('hello');
    expect(fixture(z.literal(42))).toBe(42);
  });

  it('handles union schemas', () => {
    const schema = z.union([z.string(), z.number()]);
    const result = fixture(schema);
    expect(typeof result === 'string' || typeof result === 'number').toBe(true);
  });
});
