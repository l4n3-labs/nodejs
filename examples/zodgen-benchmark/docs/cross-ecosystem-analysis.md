# Cross-Ecosystem Mock Data Tool Analysis

**Date:** March 25, 2026
**Purpose:** Identify features from best-in-class mock data libraries across languages that could strengthen zodgen's roadmap

## Overview

With zodgen's Zod-specific competitive gaps largely closed (see [competitive-analysis.md](./competitive-analysis.md)), this analysis looks beyond the Zod/JS ecosystem to identify patterns and capabilities from 5 mature, well-maintained mock data libraries in other languages.

## Libraries Analyzed

| Library | Language | Stars | Downloads | Last Active | Key Strength |
|---------|----------|-------|-----------|-------------|--------------|
| [Bogus](https://github.com/bchavez/Bogus) | .NET | 9.6k | 211M NuGet total | Oct 2025 | Most popular mock data lib overall; composable entities |
| [Hypothesis](https://github.com/HypothesisWorks/hypothesis) | Python | 8.5k | 31M/mo PyPI | Mar 2026 | Property-based testing pioneer; shrinking + targeted generation |
| [gofakeit](https://github.com/brianvoe/gofakeit) | Go | 5.3k | — | Mar 2026 | Broadest data catalog (310+ functions); multi-format output |
| [Factory Boy](https://github.com/FactoryBoy/factory_boy) | Python | 3.8k | 17M/mo PyPI | Mar 2026 | Relationship graphs; sequences; traits |
| [Instancio](https://github.com/instancio/instancio) | Java | 1.1k | — | Mar 2026 | Deepest selector API; inter-field conditional logic |

All 5 are actively maintained (commits in 2025–2026) and widely adopted in their ecosystems.

## Feature Gap Analysis

### Tier 1: High Impact, Low–Medium Effort

#### 1. Sequences / Auto-Increment

**Source:** Factory Boy (`factory.Sequence`), Bogus (`UniqueIndex`), gofakeit (`ID()`), json-schema-faker (`autoIncrement`)

Every batch call produces ordered, predictable values — IDs, timestamps, slugs. Factory Boy's `factory.Sequence(lambda n: f"user-{n}")` and Bogus's `UniqueIndex` are first-class primitives.

**Why it matters:** zodgen has `unique` constraints in batch generation but no concept of *ordering* or *sequential* values. Auto-incrementing IDs and monotonic timestamps are among the most common needs in test data. Currently users must use overrides with manual counters.

**Proposed API:**
```typescript
fixture(schema)
  .override('id', (ctx) => ctx.sequence)              // 0, 1, 2, 3...
  .override('slug', (ctx) => `post-${ctx.sequence}`)  // post-0, post-1...
  .many(100)
```

**Effort:** Low — `ctx.sequence` is the batch index, already tracked internally during `.many()` iteration. Just needs to be exposed on the context object.

---

#### 2. Optional / Nullable Probability Control

**Source:** json-schema-faker (`optionalsProbability`), Bogus (`Configure.NullProbability`), Instancio (`withNullable`)

json-schema-faker exposes a `optionalsProbability` float (0–1). Bogus and Instancio let you control nullable probability per field or globally. zodgen currently hardcodes 80% present / 20% absent for optionals and 80% value / 20% null for nullables.

**Why it matters:** Testing often requires controlling sparsity — "generate data where 50% of addresses are missing" or "always include all optional fields for snapshot tests." The hardcoded 80/20 split is a common source of test flakiness.

**Proposed API:**
```typescript
// Global config
fixture(schema, { optionalRate: 0.5 })  // 50% of optionals present
fixture(schema, { nullRate: 0.1 })      // 10% of nullables are null

// Builder methods
fixture(schema)
  .optionalRate(1.0)   // all optionals present (useful for snapshots)
  .nullRate(0.0)       // never null
```

**Effort:** Low — replace hardcoded `0.8` threshold in optional/nullable generators with a configurable value from `FixtureConfig`.

---

#### 3. Derived / Computed Fields (Inter-Field Dependencies)

**Source:** Factory Boy (`LazyAttribute`), Instancio (`assign()`), json-schema-faker (template interpolation)

Factory Boy: `email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")`
Instancio: `assign(valueOf(Phone::countryCode).to(Phone::format), is("+1"), "###-###-####")`

Field B's value depends on field A's generated value, producing internally consistent objects.

**Why it matters:** zodgen overrides receive `ctx` with path and schema info, but cannot reference *other generated fields on the same object*. This means you can't generate an email that matches the username, or a fullName that combines firstName and lastName. This is one of the most requested features across all factory libraries.

**Proposed API:**
```typescript
fixture(schema)
  .derive('email', (obj) => `${obj.username}@test.com`)
  .derive('fullName', (obj) => `${obj.firstName} ${obj.lastName}`)
  .many(100)
```

**Effort:** Medium — requires two-pass generation or deferred resolution. Generate all non-derived fields first, then resolve derived fields with access to the partial object.

---

#### 4. Traits / Named Presets

**Source:** Factory Boy (`Trait`), Bogus (`RuleSet`)

Factory Boy: `class Params: admin = factory.Trait(role='admin', permissions=[...])` → `UserFactory(admin=True)`

Composable named configurations that bundle multiple overrides into reusable, toggleable presets.

**Why it matters:** Users frequently need the same override combinations — "admin user," "expired subscription," "empty cart." Without traits, they must repeat the same `.override()` chains or build manual abstractions. Traits are more ergonomic and self-documenting.

**Proposed API:**
```typescript
const userGen = fixture(UserSchema)
  .trait('admin', { role: () => 'admin', permissions: () => ['*'] })
  .trait('inactive', { status: () => 'inactive', lastLogin: () => null })

userGen.with('admin').one()                    // admin user
userGen.with('admin', 'inactive').one()        // inactive admin (traits compose)
```

**Effort:** Medium — traits are named override bundles. Needs composition logic (merging multiple traits) and conflict resolution (last-wins or error). Fits naturally into zodgen's immutable builder pattern.

---

#### 5. Output Format Generation (SQL, CSV, JSON Lines)

**Source:** gofakeit (`SQL()`, `CSV()`, `JSON()`), Datafaker (`Schema` + `Transformer`)

gofakeit generates complete SQL INSERT statements, CSV files, JSON arrays, XML, and Markdown from one definition. Datafaker's Schema + Transformer architecture converts to any format via pluggable serializers.

**Why it matters:** Database seeding is a top use case for mock data. Currently users must generate objects then manually serialize. Direct SQL/CSV output removes friction for database seeding, API mocking, and CI test data pipelines.

**Proposed API:**
```typescript
import { toSQL, toCSV, toJSONLines } from '@l4n3/zodgen/formats'

const users = fixture(UserSchema).many(1000)

toSQL(users, { table: 'users' })
// INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com'), ...

toCSV(users)
// id,name,email\n1,Alice,alice@example.com\n...

toJSONLines(users)
// {"id":1,"name":"Alice","email":"alice@example.com"}\n...
```

**Effort:** Medium — serializers are straightforward but need to handle nested objects, arrays, dates, and null values. Could be a separate package (`@l4n3/zodgen-formats`) to keep core bundle small.

---

### Tier 2: High Impact, Higher Complexity

#### 6. Relationship Graph / SubFactory Pattern

**Source:** Factory Boy (`SubFactory`, `RelatedFactory`), Bogus (faker composition), Instancio (`assign()`)

Factory Boy's defining feature: `author = factory.SubFactory(AuthorFactory)` automatically generates connected entity trees with foreign keys. Build strategies propagate through the whole graph — `build` creates in-memory, `create` persists to DB.

**Why it could matter:** Test data often involves relationships (User has Posts, Post has Comments, Comment references User). Currently zodgen users must generate each entity separately and manually wire foreign keys, which is error-prone and verbose.

**Proposed concept:**
```typescript
const userGen = fixture(UserSchema)
const postGen = fixture(PostSchema)
  .relate('authorId', userGen, 'id')

const { users, posts } = generateGraph({
  users: userGen.many(10),
  posts: postGen.many(50)
})
// Every posts[].authorId references a valid users[].id
```

**Effort:** High — requires coordinating generation across schemas, managing reference pools, and handling circular references. Could start with a simpler version that just does foreign key assignment from a pre-generated pool.

---

#### 7. Coverage / Exhaustive Generation

**Source:** Polyfactory (`Factory.coverage()`), Instancio (`ofCartesianProduct()`)

Polyfactory generates the *minimum* set of instances to cover every union variant, every Literal value, every Enum member, and both presence/absence for optionals. Instancio's cartesian product generates all combinations of enum/boolean fields.

**Why it could matter:** Random generation can miss edge cases. Coverage mode systematically ensures every type variant is exercised at least once — valuable for visual testing (Storybook), snapshot testing, and validation coverage.

**Proposed concept:**
```typescript
fixture(schema).coverage()
// Returns array: one instance per union variant, enum value, optional presence/absence
// z.union([z.string(), z.number()]) → [stringInstance, numberInstance]
// z.enum(['a', 'b', 'c']) → [instanceWithA, instanceWithB, instanceWithC]
```

**Effort:** Medium-High — requires walking the schema tree, identifying variant axes (unions, enums, optionals, booleans), and generating the minimum covering set or full cartesian product.

---

#### 8. Plugin / Extension Registry

**Source:** gofakeit (`AddFuncLookup`), Hypothesis (`hypothesis-graphql`, `hypothesis-pb`), Datafaker (custom providers)

gofakeit lets anyone register generators at runtime. Hypothesis has a rich ecosystem of third-party strategy packages following `hypothesis-{domain}` naming.

**Why it could matter:** zodgen has `.generator()` for per-instance overrides but no global registry or community plugin conventions. A plugin system enables ecosystem growth — domain-specific generators for geo, finance, healthcare, etc.

**Proposed concept:**
```typescript
import { registerPlugin } from '@l4n3/zodgen'
import geoPlugin from '@l4n3/zodgen-plugin-geo'

registerPlugin(geoPlugin)
// Now fixture() automatically recognizes latitude, longitude, polygon, bbox semantics
```

**Effort:** Medium — zodgen already has a generator registry. Needs a `registerPlugin()` entry point and conventions for semantic/format contributions.

---

### Tier 3: Interesting but Specialized

#### 9. Shrinking / Minimal Counterexamples

**Source:** Hypothesis, QuickCheck (Haskell)

When a property test fails, Hypothesis reduces the failing input to the *smallest* value that still triggers the failure. `[432, 0, -19, 87]` shrinks to `[0, -1]`.

This transforms data generation from "create test fixtures" into "find bugs." It's the most powerful feature in property-based testing, but requires a fundamentally different generator architecture (generators must be shrinkable, not just producible).

**Recommendation:** Better suited as integration with an existing property-based testing library (e.g., `fast-check`) rather than reimplementation within zodgen. A `toArbitrary(schema)` adapter that converts Zod schemas to fast-check arbitraries would capture most of the value.

**Effort:** Very High as standalone; Medium as fast-check integration.

---

#### 10. Weighted Distribution Helpers

**Source:** gofakeit (`Weighted`), Datafaker (Gaussian, Zipf)

Real data follows non-uniform distributions — statuses cluster, ages follow bell curves, popularity follows power laws.

**Current state:** faker.js already exposes `helpers.weightedArrayElement()`, so this is achievable today via overrides. The gap is ergonomics and documentation, not capability.

**Recommendation:** Document the pattern in examples rather than adding core API surface. Optionally add a `weighted()` utility:

```typescript
import { weighted } from '@l4n3/zodgen'

fixture(schema)
  .override('status', weighted({ active: 8, pending: 1.5, archived: 0.5 }))
```

**Effort:** Low.

---

## Summary: Recommended Roadmap Additions

| Priority | Feature | Source Inspiration | Effort | Impact |
|----------|---------|-------------------|--------|--------|
| **P1** | Sequences / auto-increment (`ctx.sequence`) | Factory Boy, Bogus | Low | High |
| **P1** | Optional/null probability config | json-schema-faker, Bogus | Low | High |
| **P2** | Derived/computed fields (`.derive()`) | Factory Boy, Instancio | Medium | High |
| **P2** | Traits / named presets (`.trait()` / `.with()`) | Factory Boy, Bogus | Medium | High |
| **P2** | Output formats (SQL, CSV, JSON Lines) | gofakeit, Datafaker | Medium | High |
| **P3** | Coverage/exhaustive generation (`.coverage()`) | Polyfactory, Instancio | Medium-High | Medium |
| **P3** | Relationship graphs (`.relate()`) | Factory Boy | High | Medium |
| **P3** | Plugin/extension registry | gofakeit, Hypothesis | Medium | Medium |
| **P4** | fast-check integration (`toArbitrary()`) | Hypothesis | Medium | Medium |
| **P4** | Weighted distribution helper | gofakeit, Datafaker | Low | Low |

### Combined Roadmap (with existing items)

| Phase | Feature | Status | Source |
|-------|---------|--------|--------|
| 1 | Publish to npm | Blocked | Competitive analysis |
| 2 | Sequences / auto-increment | Not started | Cross-ecosystem (Factory Boy, Bogus) |
| 3 | Optional/null probability config | Not started | Cross-ecosystem (json-schema-faker, Bogus) |
| 4 | Derived/computed fields | Not started | Cross-ecosystem (Factory Boy, Instancio) |
| 5 | Traits / named presets | Not started | Cross-ecosystem (Factory Boy, Bogus) |
| 6 | Output formats (SQL, CSV, JSON Lines) | Not started | Cross-ecosystem (gofakeit, Datafaker) |
| 7 | Hash format support (md5/sha) | Not started | Competitive analysis |
| 8 | Migration guides + benchmarks | Ready to write | Competitive analysis |
| 9 | Coverage/exhaustive generation | Not started | Cross-ecosystem (Polyfactory) |
| 10 | Relationship graphs | Not started | Cross-ecosystem (Factory Boy) |
| 11 | Plugin/extension registry | Not started | Cross-ecosystem (gofakeit, Hypothesis) |
| 12 | fast-check integration | Not started | Cross-ecosystem (Hypothesis) |
| 13 | Fuzz testing mode | Not started | Competitive analysis |
