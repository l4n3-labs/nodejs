# @l4n3/zodgen Usage Examples

Examples demonstrating how to use [`@l4n3/zodgen`](../../packages/zodgen) to generate mock data from Zod schemas.

`zodgen` generates realistic, randomized data that respects Zod validation constraints — useful for tests, seeding databases, or prototyping.

## Running Examples

Each file in `src/` is a standalone script. Run any example with:

```bash
npx tsx examples/zodgen-usage/src/basic-primitives.ts
```

## Examples

| File | What it covers |
|------|---------------|
| [`basic-primitives.ts`](src/basic-primitives.ts) | Strings, numbers, booleans, dates, bigints, literals, null, undefined |
| [`string-formats.ts`](src/string-formats.ts) | Email, URL, UUID, IP, datetime, base64, emoji, length and content constraints |
| [`number-constraints.ts`](src/number-constraints.ts) | Integer, min/max, positive/negative, multipleOf, date ranges |
| [`objects-and-enums.ts`](src/objects-and-enums.ts) | Object schemas, enums, nested objects, `fixture.many()` |
| [`collections.ts`](src/collections.ts) | Arrays, tuples, sets, maps, records with size constraints |
| [`unions-and-optionals.ts`](src/unions-and-optionals.ts) | Union, intersection, nullable, optional, default, readonly |
| [`seeded-generation.ts`](src/seeded-generation.ts) | Deterministic output with `{ seed }` and `withSeed()` |
| [`custom-overrides.ts`](src/custom-overrides.ts) | `fixture.create()`, `override()` with string and predicate matchers |
| [`recursive-schemas.ts`](src/recursive-schemas.ts) | `z.lazy()` for trees, linked lists, and nested comment threads |
| [`restaurant-menu.ts`](src/restaurant-menu.ts) | Domain example: defaults, overrides, uniqueness, and full schema composition |

## Key APIs

```typescript
import { fixture, override, withSeed } from '@l4n3/zodgen';

// Generate a single value
const user = fixture(userSchema);

// Generate multiple values
const users = fixture.many(userSchema, 10);

// Deterministic generation
const seeded = fixture(userSchema, { seed: 42 });

// Custom overrides
const gen = fixture.create(
  withSeed(42),
  override('email', () => 'test@example.com'),
);
const custom = gen.one(userSchema);
```
