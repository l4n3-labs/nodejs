import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { fixture } from './fixture.js';

describe('fixture()', () => {
  it('generates a value from a simple schema', () => {
    const result = fixture(z.string()).one();
    expect(typeof result).toBe('string');
  });

  it('generates a full object', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number().min(18).max(99),
      role: z.enum(['admin', 'user']),
    });
    const result = fixture(schema).one();
    expect(typeof result.name).toBe('string');
    expect(result.email).toContain('@');
    expect(result.age).toBeGreaterThanOrEqual(18);
    expect(result.age).toBeLessThanOrEqual(99);
    expect(['admin', 'user']).toContain(result.role);
  });

  it('supports seeded determinism', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const a = fixture(schema, { seed: 42 }).one();
    const b = fixture(schema, { seed: 42 }).one();
    expect(a).toEqual(b);
  });
});

describe('.many()', () => {
  it('generates correct count', () => {
    const results = fixture(z.string()).many(5);
    expect(results).toHaveLength(5);
    for (const r of results) expect(typeof r).toBe('string');
  });

  it('generates varied values with seed', () => {
    const results = fixture(z.number(), { seed: 42 }).many(5);
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('enforces unique values for top-level keys', () => {
    const schema = z.object({ id: z.number().int().min(1).max(10000), name: z.string() });
    const results = fixture(schema).many(10, { unique: ['id'] });
    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('enforces unique values for nested keys with dot syntax', () => {
    const schema = z.object({
      user: z.object({
        email: z.email(),
        name: z.string(),
      }),
    });
    const results = fixture(schema).many(10, { unique: ['user.email'] });
    const emails = results.map((r) => r.user.email);
    expect(new Set(emails).size).toBe(10);
  });

  it('enforces uniqueness across multiple keys', () => {
    const schema = z.object({ id: z.uuid(), email: z.email() });
    const results = fixture(schema).many(10, { unique: ['id', 'email'] });
    expect(new Set(results.map((r) => r.id)).size).toBe(10);
    expect(new Set(results.map((r) => r.email)).size).toBe(10);
  });

  it('throws when uniqueness cannot be satisfied', () => {
    const schema = z.object({ flag: z.boolean() });
    expect(() => fixture(schema).many(5, { unique: ['flag'] })).toThrow(/unique/i);
  });

  it('works without unique option (unchanged behavior)', () => {
    const results = fixture(z.string()).many(5);
    expect(results).toHaveLength(5);
  });

  it('enforces unique values for deeply nested dot paths', () => {
    const schema = z.object({
      org: z.object({
        location: z.object({
          city: z.string(),
        }),
      }),
    });
    const results = fixture(schema).many(10, { unique: ['org.location.city'] });
    const cities = results.map((r) => r.org.location.city);
    expect(new Set(cities).size).toBe(10);
  });
});

describe('.seed()', () => {
  it('returns a new generator with seed applied', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const gen = fixture(schema).seed(42);
    const a = gen.one();
    const b = fixture(schema).seed(42).one();
    expect(a).toEqual(b);
  });
});

describe('.override()', () => {
  it('applies string key override', () => {
    const schema = z.object({ email: z.string().email() });
    const result = fixture(schema)
      .override('email', () => 'custom@test.com')
      .one();
    expect(result.email).toBe('custom@test.com');
  });

  it('first registered override wins', () => {
    const result = fixture(z.object({ name: z.string() }))
      .override('name', () => 'First')
      .override('name', () => 'Second')
      .one();
    expect(result.name).toBe('First');
  });

  it('predicate override works', () => {
    const schema = z.object({ email: z.string().email(), name: z.string() });
    const result = fixture(schema)
      .override(
        (ctx) =>
          ctx.node.type === 'string' &&
          (ctx.node as { constraints: { format?: string } }).constraints.format === 'email',
        () => 'predicate@test.com',
      )
      .one();
    expect(result.email).toBe('predicate@test.com');
    expect(typeof result.name).toBe('string');
  });
});

describe('.partialOverride()', () => {
  const schema = z.object({
    name: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      zip: z.string().length(5),
    }),
  });

  it('overrides specific nested keys while preserving others', () => {
    const result = fixture(schema, { seed: 42 })
      .partialOverride('address', { city: () => 'New York' })
      .one();

    expect(result.address.city).toBe('New York');
    expect(typeof result.address.street).toBe('string');
    expect(result.address.zip).toHaveLength(5);
  });

  it('overrides multiple nested keys', () => {
    const result = fixture(schema)
      .partialOverride('address', {
        city: () => 'Boston',
        zip: () => '02101',
      })
      .one();

    expect(result.address.city).toBe('Boston');
    expect(result.address.zip).toBe('02101');
    expect(typeof result.address.street).toBe('string');
  });

  it('does not affect fields outside the target object', () => {
    const gen = fixture(schema, { seed: 42 });
    const withPartial = gen.partialOverride('address', { city: () => 'Denver' });

    const a = gen.one();
    const b = withPartial.one();

    expect(a.name).toBe(b.name);
    expect(b.address.city).toBe('Denver');
  });

  it('works with nullable nested objects', () => {
    const s = z.object({
      profile: z
        .object({
          bio: z.string(),
          website: z.string().url(),
        })
        .nullable(),
    });

    const results = fixture(s, { seed: 1 })
      .partialOverride('profile', { bio: () => 'Custom bio' })
      .many(20);

    const nonNull = results.filter((r) => r.profile !== null);
    expect(nonNull.length).toBeGreaterThan(0);
    for (const r of nonNull) {
      expect(r.profile?.bio).toBe('Custom bio');
      expect(typeof r.profile?.website).toBe('string');
    }
  });

  it('combines with regular overrides', () => {
    const result = fixture(schema)
      .override('name', () => 'Alice')
      .partialOverride('address', { city: () => 'Seattle' })
      .one();

    expect(result.name).toBe('Alice');
    expect(result.address.city).toBe('Seattle');
    expect(typeof result.address.street).toBe('string');
  });

  it('works with deeply nested schemas', () => {
    const deep = z.object({
      org: z.object({
        location: z.object({
          country: z.string(),
          city: z.string(),
        }),
      }),
    });

    const result = fixture(deep)
      .partialOverride('org', {
        location: () => ({ country: 'US', city: 'Portland' }),
      })
      .one();

    expect(result.org.location).toEqual({ country: 'US', city: 'Portland' });
  });

  it('works with array-of-object fields', () => {
    const schema = z.object({
      tags: z
        .array(z.object({ label: z.string(), color: z.string() }))
        .min(2)
        .max(4),
    });

    const result = fixture(schema)
      .partialOverride('tags', { label: () => 'pinned' })
      .one();

    expect(result.tags.length).toBeGreaterThanOrEqual(2);
    for (const tag of result.tags) {
      expect(tag.label).toBe('pinned');
      expect(typeof tag.color).toBe('string');
    }
  });
});

describe('.for()', () => {
  it('rebinds to a new schema keeping seed', () => {
    const userSchema = z.object({ name: z.string(), age: z.number() });
    const accountSchema = z.object({ name: z.string(), balance: z.number() });

    const userGen = fixture(userSchema, { seed: 42 });
    const accountGen = userGen.for(accountSchema);

    const a = accountGen.one();
    const b = fixture(accountSchema, { seed: 42 }).one();
    expect(a).toEqual(b);
  });

  it('carries over overrides to new schema', () => {
    const userSchema = z.object({ name: z.string(), email: z.email() });
    const contactSchema = z.object({ name: z.string(), email: z.email(), phone: z.string() });

    const gen = fixture(userSchema).override('email', () => 'shared@test.com');
    const contactGen = gen.for(contactSchema);

    const contact = contactGen.one();
    expect(contact.email).toBe('shared@test.com');
    expect(typeof contact.phone).toBe('string');
  });

  it('allows further overrides after rebinding', () => {
    const userSchema = z.object({ name: z.string(), email: z.email() });
    const accountSchema = z.object({ name: z.string(), type: z.string() });

    const gen = fixture(userSchema, { seed: 42 }).override('name', () => 'Shared');
    const accountGen = gen.for(accountSchema).override('type', () => 'Partner');

    const account = accountGen.one();
    expect(account.name).toBe('Shared');
    expect(account.type).toBe('Partner');
  });

  it('does not mutate the original generator', () => {
    const userSchema = z.object({ name: z.string() });
    const otherSchema = z.object({ name: z.string(), extra: z.number() });

    const original = fixture(userSchema).override('name', () => 'Original');
    original.for(otherSchema).override('name', () => 'Changed');

    expect(original.one().name).toBe('Original');
  });
});

describe('fixture.create()', () => {
  it('is an alias for fixture', () => {
    const gen = fixture.create(z.object({ name: z.string() }), { seed: 42 });
    const result = gen.one();
    expect(typeof result.name).toBe('string');
  });

  it('supports overrides', () => {
    const gen = fixture.create(z.object({ name: z.string() })).override('name', () => 'Test');
    expect(gen.one().name).toBe('Test');
  });
});

describe('default values', () => {
  it('uses schema default value', () => {
    const schema = z.object({ role: z.string().default('viewer') });
    const result = fixture(schema).one();
    expect(result.role).toBe('viewer');
  });

  it('uses default on nullable field', () => {
    const schema = z.object({ value: z.string().nullable().default(null) });
    const result = fixture(schema).one();
    expect(result.value).toBeNull();
  });

  it('uses default on optional field', () => {
    const schema = z.object({ lang: z.string().optional().default('en') });
    const result = fixture(schema).one();
    expect(result.lang).toBe('en');
  });

  it('uses default for number', () => {
    const schema = z.object({ count: z.number().default(0) });
    const result = fixture(schema).one();
    expect(result.count).toBe(0);
  });

  it('uses default for boolean', () => {
    const schema = z.object({ active: z.boolean().default(true) });
    const result = fixture(schema).one();
    expect(result.active).toBe(true);
  });

  it('uses default consistently across many', () => {
    const schema = z.object({ status: z.enum(['active', 'inactive']).default('active') });
    const results = fixture(schema).many(10);
    for (const r of results) {
      expect(r.status).toBe('active');
    }
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

  it('overrides a field to a fixed value via string key', () => {
    const account = fixture(AccountSchema)
      .override('type', () => 'Partner')
      .one();
    expect(account.type).toBe('Partner');
  });

  it('reuses generators with different overrides', () => {
    const partnerGen = fixture(AccountSchema).override('type', () => 'Partner');
    const vendorGen = fixture(AccountSchema).override('type', () => 'Vendor');
    expect(partnerGen.one().type).toBe('Partner');
    expect(vendorGen.one().type).toBe('Vendor');
  });

  it('applies custom null probability via predicate override', () => {
    const gen = fixture(AccountSchema).override(
      (ctx) => ctx.path.at(-1) === 'deleted',
      (ctx) => (ctx.faker.number.float() < 0.15 ? null : ctx.faker.date.recent()),
    );
    const results = gen.many(200);
    const nullCount = results.filter((r) => r.deleted === null).length;
    const nonNullCount = results.filter((r) => r.deleted !== null).length;
    expect(nullCount).toBeGreaterThan(0);
    expect(nonNullCount).toBeGreaterThan(0);
    // ~15% null — allow 5-35% range for statistical tolerance
    expect(nullCount).toBeGreaterThan(10);
    expect(nullCount).toBeLessThan(70);
  });

  it('combines multiple overrides on the same schema', () => {
    const gen = fixture(AccountSchema)
      .override('type', () => 'Partner')
      .override(
        (ctx) => ctx.path.at(-1) === 'deleted',
        (ctx) => (ctx.faker.number.float() < 0.15 ? null : ctx.faker.date.recent()),
      );
    const results = gen.many(50);
    for (const account of results) {
      expect(account.type).toBe('Partner');
      expect(account.deleted === null || account.deleted instanceof Date).toBe(true);
    }
  });

  it('generates many fixtures for batch testing', () => {
    const accounts = fixture(AccountSchema, { seed: 42 })
      .override('type', () => 'Partner')
      .many(10);
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
    const result = fixture(schema).one();
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
    const result = fixture(schema).one();
    expect(typeof result.required).toBe('string');
  });

  it('handles nullable fields', () => {
    const schema = z.object({
      value: z.string().nullable(),
    });
    const result = fixture(schema).one();
    expect(result.value === null || typeof result.value === 'string').toBe(true);
  });

  it('handles recursive schemas with z.lazy()', () => {
    type Tree = { value: string; children: ReadonlyArray<Tree> };
    const treeSchema: z.ZodType<Tree> = z.object({
      value: z.string(),
      children: z.array(z.lazy(() => treeSchema)),
    });
    const result = fixture(treeSchema).one();
    expect(typeof result.value).toBe('string');
    expect(Array.isArray(result.children)).toBe(true);
  });

  it('throws for custom schemas with helpful message', () => {
    const schema = z.custom<string>();
    expect(() => fixture(schema).one()).toThrow(/override/);
  });

  it('handles enum schemas', () => {
    const schema = z.enum(['red', 'green', 'blue']);
    const result = fixture(schema).one();
    expect(['red', 'green', 'blue']).toContain(result);
  });

  it('handles literal schemas', () => {
    expect(fixture(z.literal('hello')).one()).toBe('hello');
    expect(fixture(z.literal(42)).one()).toBe(42);
  });

  it('handles union schemas', () => {
    const schema = z.union([z.string(), z.number()]);
    const result = fixture(schema).one();
    expect(typeof result === 'string' || typeof result === 'number').toBe(true);
  });
});

describe('config generators', () => {
  const customStringGenerator = (): unknown => 'custom-string';
  const customNumberGenerator = (): unknown => 999;

  it('overrides the default generator for a type via .generator()', () => {
    const result = fixture(z.string()).generator('string', customStringGenerator).one();
    expect(result).toBe('custom-string');
  });

  it('overrides the default generator for a type via FixtureOptions', () => {
    const result = fixture(z.string(), { generators: { string: customStringGenerator } }).one();
    expect(result).toBe('custom-string');
  });

  it('applies to all fields of that type in an object', () => {
    const schema = z.object({ name: z.string(), email: z.string() });
    const result = fixture(schema).generator('string', customStringGenerator).one();
    expect(result.name).toBe('custom-string');
    expect(result.email).toBe('custom-string');
  });

  it('supports multiple config generators for different types', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = fixture(schema)
      .generator('string', customStringGenerator)
      .generator('number', customNumberGenerator)
      .one();
    expect(result.name).toBe('custom-string');
    expect(result.age).toBe(999);
  });

  it('path-based overrides take priority over config generators', () => {
    const schema = z.object({ name: z.string(), title: z.string() });
    const result = fixture(schema)
      .generator('string', customStringGenerator)
      .override('name', () => 'override-wins')
      .one();
    expect(result.name).toBe('override-wins');
    expect(result.title).toBe('custom-string');
  });

  it('does not affect other types', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = fixture(schema).generator('string', customStringGenerator).one();
    expect(result.name).toBe('custom-string');
    expect(typeof result.age).toBe('number');
  });

  it('is immutable — does not mutate the original generator', () => {
    const gen = fixture(z.string());
    gen.generator('string', customStringGenerator);
    const result = gen.one();
    expect(result).not.toBe('custom-string');
  });
});

describe('optionalRate / nullRate', () => {
  it('optionalRate: 1.0 always generates the inner value', () => {
    const schema = z.object({ name: z.string().optional() });
    const results = fixture(schema, { seed: 1 }).optionalRate(1.0).many(50);
    expect(results.every((r) => r.name !== undefined)).toBe(true);
  });

  it('optionalRate: 0.0 always generates undefined', () => {
    const schema = z.object({ name: z.string().optional() });
    const results = fixture(schema, { seed: 1 }).optionalRate(0.0).many(50);
    expect(results.every((r) => r.name === undefined)).toBe(true);
  });

  it('nullRate: 1.0 always generates null', () => {
    const schema = z.object({ name: z.string().nullable() });
    const results = fixture(schema, { seed: 1 }).nullRate(1.0).many(50);
    expect(results.every((r) => r.name === null)).toBe(true);
  });

  it('nullRate: 0.0 never generates null', () => {
    const schema = z.object({ name: z.string().nullable() });
    const results = fixture(schema, { seed: 1 }).nullRate(0.0).many(50);
    expect(results.every((r) => r.name !== null)).toBe(true);
  });

  it('accepts optionalRate via FixtureOptions', () => {
    const schema = z.object({ name: z.string().optional() });
    const results = fixture(schema, { seed: 1, optionalRate: 1.0 }).many(20);
    expect(results.every((r) => r.name !== undefined)).toBe(true);
  });

  it('accepts nullRate via FixtureOptions', () => {
    const schema = z.object({ name: z.string().nullable() });
    const results = fixture(schema, { seed: 1, nullRate: 0.0 }).many(20);
    expect(results.every((r) => r.name !== null)).toBe(true);
  });

  it('default rates preserve existing 80/20 behavior', () => {
    const schema = z.object({ name: z.string().optional() });
    const results = fixture(schema, { seed: 42 }).many(200);
    const presentCount = results.filter((r) => r.name !== undefined).length;
    expect(presentCount).toBeGreaterThan(100);
    expect(presentCount).toBeLessThan(200);
  });
});

describe('.trait() / .with()', () => {
  const userSchema = z.object({
    name: z.string(),
    role: z.enum(['admin', 'editor', 'viewer']),
    status: z.enum(['active', 'inactive', 'suspended']),
  });

  it('applies a single trait', () => {
    const gen = fixture(userSchema, { seed: 1 }).trait('admin', { role: () => 'admin' as const });
    const user = gen.with('admin').one();
    expect(user.role).toBe('admin');
  });

  it('composes multiple traits', () => {
    const gen = fixture(userSchema, { seed: 1 })
      .trait('admin', { role: () => 'admin' as const })
      .trait('inactive', { status: () => 'inactive' as const });
    const user = gen.with('admin', 'inactive').one();
    expect(user.role).toBe('admin');
    expect(user.status).toBe('inactive');
  });

  it('explicit .override() takes precedence over traits', () => {
    const gen = fixture(userSchema, { seed: 1 })
      .trait('admin', { role: () => 'admin' as const })
      .override('role', () => 'viewer' as const);
    const user = gen.with('admin').one();
    expect(user.role).toBe('viewer');
  });

  it('throws on unknown trait name', () => {
    const gen = fixture(userSchema, { seed: 1 });
    expect(() => gen.with('nonexistent')).toThrow(/Unknown trait: "nonexistent"/);
  });

  it('defining a trait does not affect generation until .with() is called', () => {
    const gen = fixture(userSchema, { seed: 42 }).trait('admin', { role: () => 'admin' as const });
    const user = gen.one();
    // Without .with('admin'), role is randomly generated
    expect(['admin', 'editor', 'viewer']).toContain(user.role);
  });

  it('traits work with .many() batch generation', () => {
    const gen = fixture(userSchema, { seed: 1 }).trait('admin', { role: () => 'admin' as const });
    const users = gen.with('admin').many(5);
    expect(users.every((u) => u.role === 'admin')).toBe(true);
  });
});

describe('.derive()', () => {
  const userSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    username: z.string(),
    email: z.email(),
  });

  it('derives a field from other generated fields', () => {
    const gen = fixture(userSchema, { seed: 1 }).derive('fullName', (obj) => `${obj.firstName} ${obj.lastName}`);
    const user = gen.one();
    expect(user.fullName).toBe(`${user.firstName} ${user.lastName}`);
  });

  it('supports multiple chained derivations', () => {
    const gen = fixture(userSchema, { seed: 1 })
      .derive('fullName', (obj) => `${obj.firstName} ${obj.lastName}`)
      .derive('email', (obj) => `${obj.username}@test.com`);
    const user = gen.one();
    expect(user.fullName).toBe(`${user.firstName} ${user.lastName}`);
    expect(user.email).toBe(`${user.username}@test.com`);
  });

  it('derivations run after overrides', () => {
    const gen = fixture(userSchema, { seed: 1 })
      .override('firstName', () => 'Alice')
      .override('lastName', () => 'Smith')
      .derive('fullName', (obj) => `${obj.firstName} ${obj.lastName}`);
    const user = gen.one();
    expect(user.fullName).toBe('Alice Smith');
  });

  it('works with .many() batch generation', () => {
    const gen = fixture(userSchema, { seed: 42 }).derive('fullName', (obj) => `${obj.firstName} ${obj.lastName}`);
    const users = gen.many(5);
    for (const user of users) {
      expect(user.fullName).toBe(`${user.firstName} ${user.lastName}`);
    }
  });
});

describe('ctx.sequence', () => {
  const schema = z.object({ id: z.number(), name: z.string() });

  it('is 0 for .one()', () => {
    const gen = fixture(schema).override('id', (ctx) => ctx.sequence);
    expect(gen.one().id).toBe(0);
  });

  it('increments 0..N-1 for .many(N)', () => {
    const gen = fixture(schema).override('id', (ctx) => ctx.sequence);
    const results = gen.many(5);
    expect(results.map((r) => r.id)).toEqual([0, 1, 2, 3, 4]);
  });

  it('works with string interpolation in overrides', () => {
    const gen = fixture(schema).override('name', (ctx) => `user-${ctx.sequence}`);
    const results = gen.many(3);
    expect(results.map((r) => r.name)).toEqual(['user-0', 'user-1', 'user-2']);
  });

  it('child fields inherit parent sequence value', () => {
    const nested = z.object({ wrapper: z.object({ id: z.number() }) });
    const gen = fixture(nested).override(
      (ctx) => ctx.path.at(-1) === 'id',
      (ctx) => ctx.sequence,
    );
    const results = gen.many(3);
    expect(results.map((r) => r.wrapper.id)).toEqual([0, 1, 2]);
  });

  it('works alongside uniqueness constraints', () => {
    const gen = fixture(schema).override('id', (ctx) => ctx.sequence);
    const results = gen.many(5, { unique: ['id'] });
    expect(new Set(results.map((r) => r.id)).size).toBe(5);
    expect(results.map((r) => r.id)).toEqual([0, 1, 2, 3, 4]);
  });
});
