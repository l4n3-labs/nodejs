# @l4n3/fakeish

Generate realistic test fixtures from Zod schemas.

## Installation

```bash
pnpm add -D @l4n3/fakeish
```

Peer dependencies: `zod@>=4.0.0-beta.0`, `@faker-js/faker@>=9.0.0`

## Quick start

```typescript
import { z } from 'zod/v4';
import { fixture } from '@l4n3/fakeish';

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(100),
  email: z.string().email(),
  age: z.number().min(18).max(99),
  role: z.enum(['admin', 'user']),
});

// Generate one fixture
const user = fixture(UserSchema);
// { id: '3f8a...', name: 'xkqmz', email: 'john@example.com', age: 42, role: 'admin' }

// Generate many fixtures
const users = fixture.many(UserSchema, 10);

// Deterministic output with a seed
const deterministic = fixture(UserSchema, { seed: 42 });
```

## Regex patterns

Generate strings that match a regular expression:

```typescript
import { z } from 'zod/v4';
import { fixture } from '@l4n3/fakeish';

// Simple pattern
const code = fixture(z.string().regex(/[A-Z]{2}-\d{4}/)).one();
// e.g. 'QX-7291'

// Object with regex-constrained fields
const OrderSchema = z.object({
  orderId: z.string().regex(/ORD-\d{6}/),
  trackingCode: z.string().regex(/[A-Z0-9]{10}/),
  status: z.enum(['pending', 'shipped', 'delivered']),
});

const order = fixture(OrderSchema).one();
// { orderId: 'ORD-483201', trackingCode: 'K7M2P9X4RQ', status: 'shipped' }

// Batch — every item matches the pattern
const codes = fixture(z.string().regex(/\d{3}-\d{3}-\d{4}/)).many(10);
```

Supported regex features: character classes (`[a-z]`, `[^0-9]`, `\d`, `\w`, `\s`), quantifiers (`*`, `+`, `?`, `{n}`, `{n,m}`), groups, alternation (`a|b`), anchors, backreferences, and dot (`.`).

## Overrides

Use `fixture.create()` with `override()` to customize how specific fields are generated.

### String matcher

Match fields by property name:

```typescript
import { fixture, override } from '@l4n3/fakeish';

const gen = fixture.create(override('type', () => 'Partner'));
const account = gen.one(AccountSchema);
// account.type === 'Partner'
```

### Predicate matcher

Match fields using a function that inspects the generation context:

```typescript
const gen = fixture.create(
  override(
    (ctx) => ctx.path.at(-1) === 'email',
    () => 'test@example.com',
  ),
);
```

The context (`ctx`) provides:

- `ctx.path` — array of property names from root to current field (e.g. `['users', 'email']`)
- `ctx.schema` — the Zod schema for the current field
- `ctx.checks` — query interface for schema constraints (`.has('string_format')`, `.find('min_length')`)
- `ctx.faker` — the Faker.js instance (seeded if using `withSeed()`)
- `ctx.depth` — current nesting depth

### Custom probability

Override the default 80/20 nullable behavior with custom logic:

```typescript
const gen = fixture.create(
  override(
    (ctx) => ctx.path.at(-1) === 'deleted',
    (ctx) => ctx.faker.number.float() < 0.15 ? null : ctx.faker.date.recent(),
  ),
);
// deleted will be null ~15% of the time
```

### Combining overrides

Pass multiple overrides to `fixture.create()`. They are checked in registration order — the first match wins:

```typescript
const gen = fixture.create(
  override('type', () => 'Partner'),
  override(
    (ctx) => ctx.path.at(-1) === 'deleted',
    (ctx) => ctx.faker.number.float() < 0.15 ? null : ctx.faker.date.recent(),
  ),
);
```

### Reusable generators

Create separate generators for different test scenarios:

```typescript
const partnerGen = fixture.create(override('type', () => 'Partner'));
const vendorGen = fixture.create(override('type', () => 'Vendor'));

const partner = partnerGen.one(AccountSchema);
const vendor = vendorGen.one(AccountSchema);
```

## Seeded generation

Use `withSeed()` for deterministic output:

```typescript
import { fixture, withSeed, override } from '@l4n3/fakeish';

const gen = fixture.create(
  withSeed(42),
  override('type', () => 'Partner'),
);

// Same seed + same schema = same output every time
const a = gen.one(AccountSchema);
const b = gen.one(AccountSchema);
// a deep-equals b
```

## Real-world example

```typescript
import { z } from 'zod/v4';
import { fixture, override, withSeed } from '@l4n3/fakeish';

const AccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(255),
  type: z.string().nullable(),
  deleted: z.coerce.date().max(new Date()).nullable(),
  createdAt: z.coerce.date().max(new Date()),
  createdBy: z.string().email().nullable(),
  updatedAt: z.coerce.date().max(new Date()).nullable(),
  updatedBy: z.string().email().nullable(),
});

// Generate a batch of Partner accounts with controlled soft-delete probability
const gen = fixture.create(
  withSeed(42),
  override('type', () => 'Partner'),
  override(
    (ctx) => ctx.path.at(-1) === 'deleted',
    (ctx) => ctx.faker.number.float() < 0.15 ? null : ctx.faker.date.recent(),
  ),
);

const accounts = gen.many(AccountSchema, 50);
```

## API reference

### `fixture(schema, opts?)`

Generate a single value. Options: `{ seed?: number }`.

### `fixture.many(schema, count, opts?)`

Generate `count` values. Returns `ReadonlyArray<T>`.

### `fixture.create(...transforms)`

Create a reusable `FixtureGenerator` with transforms applied. Returns `{ one(schema), many(schema, count) }`.

### `override(matcher, generate)`

Create a transform that overrides generation for matching fields.

- **String matcher**: matches when the last path segment equals the string
- **Predicate matcher**: `(ctx: GenContext<T>) => boolean`
- **Generate**: `(ctx: GenContext<T>) => T` — returns the value to use

### `withSeed(seed)`

Create a transform that seeds the Faker.js instance for deterministic output.

### Exported types

`GenContext`, `GeneratorConfig`, `Override`, `OverrideMatcher`, `Transform`, `FixtureGenerator`, `FixtureOptions`, `CheckSet`, `ZodCheckDef`
