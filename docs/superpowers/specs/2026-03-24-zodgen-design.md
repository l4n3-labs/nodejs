# @l4n3/zodgen — Design Spec

## Context

Existing Zod fixture/mock libraries (zod-fixture, @anatine/zod-mock, zod-v4-mocks) are either class/OOP-oriented, don't support Zod v4, or have limited type coverage. We need a modern, functional, pipe-composable fixture generator that:

- Targets Zod v4 exclusively (uses `_zod.def` internals)
- Uses `@faker-js/faker` for realistic data generation
- Follows a functional builder pattern (no classes, no mutation)
- Respects all Zod constraints (`.email()`, `.min()`, `.max()`, etc.)
- Fits into the `@l4n3` monorepo conventions (ESM, const arrows, shared configs)

**Zod v4 compatibility note:** This library depends on Zod v4's `_zod.def` internal structure, which is documented for library authors but may change between beta releases. We pin to `zod >=4.0.0-beta.0` and will track breaking changes.

## Public API

```typescript
import { fixture, withSeed, override } from '@l4n3/zodgen'
import { z } from 'zod/v4'
import { faker } from '@faker-js/faker'

const UserSchema = z.object({
  name: z.string(),
  email: z.email(),
  age: z.number().min(18).max(99),
  role: z.enum(['admin', 'user']),
})

// 1. Zero-config
const user = fixture(UserSchema)
// => { name: 'Lorem ipsum', email: 'john@example.com', age: 42, role: 'admin' }

// 2. Seeded for deterministic tests
const user2 = fixture(UserSchema, { seed: 42 })

// 3. Configured generator via pipe composition
const gen = fixture.create(
  withSeed(42),
  override('email', () => faker.internet.email()),
  override(
    (ctx) => ctx.def.type === 'string' && ctx.checks.has('string_format'),
    (ctx) => faker.internet.email(),
  ),
)
const user3 = gen(UserSchema)

// 4. Batch generation
const users = fixture.many(UserSchema, 5)
const users2 = gen.many(UserSchema, 5)
```

### API Surface

| Export | Type | Description |
|--------|------|-------------|
| `fixture(schema, opts?)` | `<T>(schema: ZodType<T>, opts?: { seed?: number }) => T` | One-shot generation |
| `fixture.create(...transforms)` | `(...transforms: Transform[]) => FixtureGenerator` | Create configured generator |
| `fixture.many(schema, count, opts?)` | `<T>(schema: ZodType<T>, count: number, opts?: { seed?: number }) => T[]` | Batch generation |
| `withSeed(seed)` | `Transform` | Set deterministic seed |
| `override(matcher, fn)` | `Transform` | Custom generator for matched schemas |

The `FixtureGenerator` type returned by `fixture.create()`:

```typescript
type FixtureGenerator = {
  readonly one: <T>(schema: ZodType<T>) => T
  readonly many: <T>(schema: ZodType<T>, count: number) => T[]
}
```

**Note on `fixture.create()` return type:** Rather than returning a callable-with-properties (which requires mutation), `fixture.create()` returns a plain object with `one` and `many` methods. This avoids the mutation tradeoff of assigning properties to functions.

### Override Matchers

The `override()` transform accepts two matcher types:

```typescript
// 1. Path segment — matches when the last path segment equals the string
override('email', (ctx) => faker.internet.email())

// 2. Predicate — full control over matching
override(
  (ctx) => ctx.path.at(-1) === 'email' && ctx.checks.has('string_format'),
  (ctx) => faker.internet.email(),
)
```

**Override resolution order:** Overrides are checked in registration order (first registered, first checked). The first matching override wins. This matches the intuitive reading order of `fixture.create(override1, override2)` — `override1` takes priority.

## Architecture

### Layers

```
┌─────────────────────────────────────────────┐
│  Public API: fixture(), fixture.create()    │  ← fixture.ts
├─────────────────────────────────────────────┤
│  Config Transform Pipeline                  │  ← config.ts, transforms/
│  Transform[] → reduce → GeneratorConfig     │
├─────────────────────────────────────────────┤
│  Schema Resolver                            │  ← resolve.ts
│  Walks schema tree, dispatches to generators│
├─────────────────────────────────────────────┤
│  Built-in Generators                        │  ← generators/
│  One per Zod def type, constraint-aware     │
├─────────────────────────────────────────────┤
│  Faker                                      │  ← peer dependency
└─────────────────────────────────────────────┘
```

### Core Types

```typescript
// --- Config ---

type GeneratorConfig = {
  readonly seed: number | undefined
  readonly overrides: ReadonlyArray<Override>
}

type Transform = (config: GeneratorConfig) => GeneratorConfig

// --- Overrides ---

type Override = {
  readonly matcher: OverrideMatcher
  readonly generate: (ctx: GenContext) => unknown
}

type OverrideMatcher =
  | string                           // path segment match
  | ((ctx: GenContext) => boolean)    // predicate

// --- Generation Context ---

type GenContext = {
  readonly schema: ZodType
  readonly def: ZodDef
  readonly path: ReadonlyArray<string>
  readonly depth: number
  readonly faker: Faker
  readonly config: GeneratorConfig
  readonly checks: CheckSet
  readonly generate: (schema: ZodType) => unknown  // recursive self-reference
}

// --- Check Queries ---

type CheckDef = {
  readonly check: string
  readonly [key: string]: unknown
}

type CheckSet = {
  readonly has: (check: string) => boolean
  readonly find: (check: string) => CheckDef | undefined
  readonly all: () => ReadonlyArray<CheckDef>
}
```

### Config Pipeline

```typescript
const defaultConfig: GeneratorConfig = {
  seed: undefined,
  overrides: [],
}

const applyTransforms = (transforms: ReadonlyArray<Transform>): GeneratorConfig =>
  transforms.reduce((config, transform) => transform(config), defaultConfig)
```

### Schema Resolver

The resolver is the core engine. It:

1. Creates a `GenContext` for the current schema node
2. Checks overrides in registration order — first match wins
3. Falls back to the built-in generator registry
4. Throws descriptive error if no generator found

```typescript
const resolve = (schema: ZodType, config: GeneratorConfig, path: ReadonlyArray<string>, depth: number, faker: Faker): unknown => {
  const ctx = createContext(schema, config, path, depth, faker)

  // Check overrides first (registration order, first match wins)
  const matchedOverride = config.overrides.find((o) => matchOverride(o.matcher, ctx))
  if (matchedOverride) return matchedOverride.generate(ctx)

  // Fall back to built-in generator
  const generator = generators.get(schema._zod.def.type)
  if (!generator) throw new Error(`No generator for type: ${schema._zod.def.type}`)
  return generator(ctx)
}
```

### Generator Registry

A `ReadonlyMap<string, (ctx: GenContext) => unknown>` mapping Zod def type strings to generator functions.

### Built-in Generators

Each generator reads constraints from `schema._zod.def.checks` and produces valid values:

| Zod Type | Generator Strategy | Key Constraints |
|----------|-------------------|-----------------|
| `string` | faker string methods based on format checks | `min_length`, `max_length`, `string_format` (email/url/uuid/ip/cuid/ulid), `includes`, `starts_with`, `ends_with` |
| `number` | `faker.number.int/float` with range | `less_than`, `greater_than`, `multiple_of`, `int`, `finite` |
| `boolean` | `faker.datatype.boolean()` | — |
| `date` | `faker.date.between()` with range | `less_than`, `greater_than` |
| `bigint` | `BigInt(faker.number.int())` | `less_than`, `greater_than`, `multiple_of` |
| `object` | Recursively generate each key in `def.shape` | — |
| `array` | Generate `n` elements via inner schema | `min_length`, `max_length` |
| `tuple` | Generate each positional item | — |
| `set` | Like array, deduplicated (max 100 retries, then throw) | `min_length`, `max_length` |
| `map` | Generate key-value pairs (default 1-3 entries) | `min_length`, `max_length` |
| `record` | Generate 1-3 string keys + values; respects key schema if provided | — |
| `enum` | Pick random value from `schema.enum` | — |
| `nativeEnum` | Pick random value from native enum | — |
| `union` | Pick random variant, generate it | — |
| `discriminatedUnion` | Pick random variant, generate it | — |
| `intersection` | Generate left side, then generate right side, shallow merge (right wins on conflict) | — |
| `literal` | Return the literal value | — |
| `nullable` | 80% inner value, 20% null | — |
| `optional` | 80% inner value, 20% undefined | — |
| `default` | Generate inner value (ignore default) | — |
| `readonly` | Generate inner, freeze | — |
| `catch` | Generate inner value (ignore catch fallback) | — |
| `lazy` | Recursively resolve; depth limit 3, returns `undefined` at limit | — |
| `promise` | Generate inner, wrap in `Promise.resolve()` | — |
| `branded` | Generate inner (brand is type-only) | — |
| `pipe` | Generate from input schema (pre-transform) | — |
| `effects` / `transform` / `refine` | Generate from inner schema (pre-transform/pre-refine) | — |
| `nan` | `NaN` | — |
| `null` | `null` | — |
| `undefined` | `undefined` | — |
| `void` | `undefined` | — |
| `never` | Throw error | — |
| `unknown` / `any` | `null` | — |
| `symbol` | `Symbol()` | — |
| `custom` | Throw with descriptive error ("use override() for custom schemas") | — |
| `templateLiteral` | Generate each part, concatenate | — |

**Coerce variants** (`z.coerce.string()`, etc.): These produce the same underlying schema type (e.g., `z.coerce.string()` has `def.type === 'string'`), so they are handled transparently by the existing generators.

**Regex constraint:** Not supported in v1. String schemas with `.regex()` checks will generate a plain string matching other constraints (length, etc.) but not the regex pattern. Users can use `override()` for regex-constrained fields. Regex generation (via `randexp` or similar) is a future enhancement.

### CheckSet Helper

```typescript
const createCheckSet = (checks: ReadonlyArray<unknown>): CheckSet => ({
  has: (name) => checks.some((c: any) => c._zod.def.check === name),
  find: (name) => {
    const found = checks.find((c: any) => c._zod.def.check === name)
    return found ? (found as any)._zod.def : undefined
  },
  all: () => checks.map((c: any) => (c as any)._zod.def),
})
```

**Note on `any` in CheckSet:** Zod v4's check types are not exported as a public union type. The `any` casts here are isolated to the CheckSet factory and don't leak into the public API. The returned `CheckDef` type provides structure.

### Seeded Determinism

```typescript
import { Faker, base, en } from '@faker-js/faker'

const createFaker = (seed: number | undefined): Faker => {
  const f = new Faker({ locale: [en, base] })
  if (seed !== undefined) f.seed(seed)
  return f
}
```

## File Structure

```
packages/zodgen/
  src/
    index.ts              # Package entry point — exports public API
    fixture.ts            # fixture(), fixture.create(), fixture.many()
    types.ts              # All TypeScript types
    config.ts             # defaultConfig, applyTransforms()
    resolve.ts            # Schema walker + generator dispatch
    context.ts            # createContext(), createCheckSet()
    generators/
      registry.ts         # Generator registry map
      string.ts           # String generator (format-aware)
      number.ts           # Number generator (range-aware)
      boolean.ts          # Boolean generator
      date.ts             # Date generator (range-aware)
      bigint.ts           # BigInt generator
      object.ts           # Object generator (recursive)
      array.ts            # Array generator (length-aware)
      tuple.ts            # Tuple generator
      set.ts              # Set generator (dedup with retry limit)
      map.ts              # Map generator
      record.ts           # Record generator (key schema aware)
      enum.ts             # Enum + native enum generator
      union.ts            # Union + discriminated union
      intersection.ts     # Intersection generator (shallow merge)
      literal.ts          # Literal value generator
      nullable.ts         # Nullable/optional/default/readonly/catch
      recursive.ts        # Lazy + promise + branded + pipe + effects
      primitives.ts       # null, undefined, void, never, unknown, any, symbol, nan
      template-literal.ts # Template literal generator
    transforms/
      seed.ts             # withSeed()
      override.ts         # override()
    fixture.test.ts       # Integration tests — full schema generation
    generators.test.ts    # Unit tests — per-generator constraint handling
    transforms.test.ts    # Unit tests — transform composition
  package.json
  tsconfig.json           # extends @l4n3/tsconfig/library.json
  vitest.config.ts        # mergeConfig(sharedVitestConfig, defineConfig({}))
  biome.json              # extends @l4n3/biome-config/biome
```

## Package Configuration

```json
{
  "name": "@l4n3/zodgen",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsgo --build",
    "check": "tsgo --noEmit",
    "test": "vitest run",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  },
  "peerDependencies": {
    "@faker-js/faker": ">=9.0.0",
    "zod": ">=4.0.0-beta.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.8",
    "@faker-js/faker": "^9.0.0",
    "@l4n3/biome-config": "workspace:*",
    "@l4n3/tsconfig": "workspace:*",
    "@l4n3/vitest-config": "workspace:*",
    "@typescript/native-preview": "^7.0.0-dev",
    "vitest": "^3.2.1",
    "zod": "^4.0.0-beta.0"
  }
}
```

## Testing Strategy

### Unit Tests (generators.test.ts)
- Each generator tested in isolation with constraint variations
- Verify constraint adherence: `z.string().email()` produces valid email, `z.number().min(5)` produces >= 5
- Seed determinism: same seed → same output
- Set dedup retry limit: `z.set(z.boolean()).min(3)` throws
- Intersection shallow merge: verify right-side wins on key conflict
- Record with enum key schema: produces valid keys

### Integration Tests (fixture.test.ts)
- Full nested schemas (objects with arrays of objects)
- Override composition: multiple overrides, first-registered-first-checked behavior
- `fixture.many()` produces correct count
- Recursive schemas with `z.lazy()` stop at depth 3
- Edge cases: empty objects, single-item enums, optional-heavy schemas
- Schemas with effects/transforms generate from input schema
- Custom schemas throw with helpful error message

### Transform Tests (transforms.test.ts)
- `withSeed()` produces deterministic results
- `override()` with string matcher, predicate matcher
- First-registered override takes priority over later ones

## Verification

```bash
# Build the package
pnpm --filter @l4n3/zodgen build

# Typecheck
pnpm --filter @l4n3/zodgen check

# Run tests
pnpm --filter @l4n3/zodgen test

# Lint
pnpm --filter @l4n3/zodgen lint

# Full monorepo verification
pnpm build && pnpm check && pnpm test
```

## Implementation Order

1. **Package scaffold** — package.json, tsconfig.json, vitest.config.ts, biome.json
2. **Types** — All type definitions in `types.ts`
3. **Config + transforms** — `config.ts`, `transforms/seed.ts`, `transforms/override.ts`
4. **Context** — `createContext()`, `createCheckSet()`
5. **Primitive generators** — string, number, boolean, date, bigint, literal, enum, nan, primitives
6. **Composite generators** — object, array, tuple, set, map, record, template-literal
7. **Complex generators** — union, intersection, nullable, optional, default, catch, lazy, branded, pipe, effects
8. **Resolver** — Schema walker connecting generators
9. **Fixture API** — `fixture()`, `fixture.create()`, `fixture.many()`
10. **Tests** — Unit + integration tests
11. **Public exports** — `index.ts`

## Agent Parallelization Strategy

Steps 1-4 are sequential (foundations). Steps 5-7 (generators) can be parallelized across 3 agents:
- **Agent A**: Primitive generators (string, number, boolean, date, bigint, literal, enum, nan, primitives)
- **Agent B**: Composite generators (object, array, tuple, set, map, record, template-literal)
- **Agent C**: Complex generators (union, intersection, nullable, optional, default, catch, lazy, branded, pipe, effects)

Steps 8-11 are sequential (integration layer depends on all generators).
