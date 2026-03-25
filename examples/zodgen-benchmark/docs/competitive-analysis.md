# Zodgen Competitive Analysis

**Date:** March 2026
**Competitors evaluated:** zod-fixture, zod-schema-faker, zocker, zod-mocking, zodock

## Overview

This analysis compares zodgen against 5 open-source Zod mock data generators across features, API design, maintenance status, and ecosystem fit. Data was gathered from GitHub repos, npm registries, and programmatic feature testing.

## Market Landscape

| Metric | zodgen | zod-fixture | zod-schema-faker | zocker | zod-mocking | zodock |
|--------|--------|-------------|-------------------|--------|-------------|--------|
| npm downloads/mo | — | ~110K | ~89K | ~170K | ~90 | ~20K |
| GitHub stars | — | 147 | 106 | 90 | 37 | 14 |
| Last code commit | Active | Dec 2023 | Mar 2026 | Aug 2025 | Jun 2021 | Feb 2024 |
| Maintenance | Active | Stalled | Active | Active | Abandoned | Dormant |
| Bundle (gzip) | ~10 KB* | 9.7 KB | 6.2 KB | 168 KB | 21 KB | 2.2 KB |
| Faker.js dep | Yes (v9) | No | Yes (v10) | Yes (v10) | No | No |

*zodgen size excludes @faker-js/faker peer dependency

## Feature Matrix

| Feature | zodgen | zod-fixture | zod-schema-faker | zocker | zod-mocking | zodock |
|---------|:------:|:-----------:|:----------------:|:------:|:-----------:|:------:|
| **Compatibility** |
| Zod v4 support | Y | N | Y | Y | N | N |
| Zod v3 support | — | Y | Y | Y | Y | Y |
| Zod mini support | — | N | Y | Y | N | N |
| **Core Features** |
| Deterministic seeding | Y | Y | Y | Y | Y | N |
| Realistic data (faker) | Y | N | Y | Y | N | N |
| Locale support | — | N | Y | Y* | N | N |
| Custom overrides | Y | Y | Y | Y | N | N |
| **Override System** |
| String key overrides | Y | — | — | — | — | — |
| Predicate overrides | Y | Y† | N | N | N | N |
| Partial nested overrides | Y | N | N | N | N | N |
| Path-aware context | Y | Y† | N | N | N | N |
| Check/constraint context | Y | Y† | N | N | N | N |
| Type-safe override autocomplete | Y | N | N | N | N | N |
| **Generation Modes** |
| Single generation | Y | Y | Y | Y | Y | Y |
| Batch generation | Y | N | N | Y‡ | N | N |
| Uniqueness constraints | Y | N | N | N | N | N |
| Invalid data generation | N | N | N | N | Y | N |
| Semantic field detection | N | N | N | Y | N | N |
| **API Design** |
| Immutable builder | Y | N | N | Y | N | N |
| Method chaining | Y | N | N | Y | N | N |
| Schema rebinding (.for()) | Y | N | N | N | N | N |
| **Constraint Awareness** |
| String min/max length | Y | Y | Y | Y | N | N |
| String startsWith/endsWith | Y | N | N | N | N | N |
| Number int/min/max | Y | Y | Y | Y | N | N |
| Number multipleOf | Y | Y | Y | Y | N | N |
| Array size constraints | Y | Y | Y | Y | N | N |
| Date min/max | Y | Y | Y | Y | N | N |
| **String Formats** |
| email, url, uuid | Y | Y | Y | Y | N | N |
| ipv4, ipv6 | Y | Y | Y | Y | N | N |
| cuid, cuid2, ulid, nanoid | Y | Y | Y | Y | N | N |
| base64, base64url | Y | N | Y | Y | N | N |
| ISO datetime/date/time | Y | Y | Y | Y | N | N |
| emoji | Y | N | Y | Y | N | N |
| cidr, duration, jwt, e164 | N | N | Y | Y | N | N |
| ksuid, xid, hex, hostname | N | N | Y | Y | N | N |
| md5/sha hash variants | N | N | Y | N | N | N |
| Template literals | Y | N | Y | N | N | N |
| **Advanced Types** |
| Recursive (z.lazy) | Y | Y | Y | Y | N | Y |
| Intersection | Y | Y | N§ | Y* | N | N |
| Pipe/transform | Y | N | Y | Y | N | Y |
| Custom (z.custom) | Y¶ | N | Y | N | N | N |

*zocker locale support is indirect via faker; intersection is partial
†zod-fixture uses a Generator() pattern with schema matching + filter + path matching
‡zocker has .generateMany() but no uniqueness constraints
§zod-schema-faker v4 intersection is WIP
¶zodgen requires explicit override for z.custom()

## SWOT Analysis

### zodgen

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Richest override system (string key O(1) + predicate + partial) | Not published to npm yet |
| | Full constraint awareness (startsWith, endsWith, includes, multipleOf) | No semantic field name detection |
| | Immutable chainable builder with type-safe autocomplete | No locale configuration API |
| | Uniqueness constraints in batch generation | No invalid/negative data mode |
| | Schema rebinding (.for()) for reusable generators | Missing some string formats (cidr, jwt, e164, etc.) |
| | Template literal support | |
| | Zod v4 native | |
| **External** | **Opportunities** | **Threats** |
| | Semantic field detection using rich ctx.path system | zocker leads with 170K monthly downloads |
| | Locale API (already uses faker — just needs surface) | zod-schema-faker has broadest format coverage |
| | Invalid data generation mode (.invalid()) — no maintained tool does this | Both active competitors also support Zod v4 |
| | Become the go-to Zod v4 fixture library | |
| | Constraint-aware fuzz testing (valid + boundary + invalid) | |
| | Migration guides from abandoned competitors | |

### zod-fixture

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Zero faker dependency (9.7 KB gzip) | Effectively unmaintained (last code Dec 2023) |
| | Rich Generator extensibility (schema + filter + path matching) | No Zod v4 support |
| | Two transformer modes (constrained/unconstrained) | Generates structurally valid but unrealistic data |
| | Second-highest download count | Limited string format coverage (~9) |
| **External** | **Opportunities** | **Threats** |
| | Could be forked/revived by community | Obsolescence as Zod v4 becomes standard |
| | Lightweight niche for CI/testing pipelines | Active competitors surpass in every dimension |

### zod-schema-faker

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Broadest string format coverage (35+) | Simple API — no builder pattern |
| | Zod v4 + v3 + mini support | No batch generation or uniqueness |
| | Full locale support via faker | No path-level or predicate overrides |
| | Actively maintained (Mar 2026) | No immutable configuration |
| | md5/sha hash format support (unique) | |
| **External** | **Opportunities** | **Threats** |
| | Expand API with builder pattern, batch utilities | zodgen and zocker offer richer APIs |
| | Largest format catalog is a moat | |

### zocker

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Semantic field name detection (unique) | Largest bundle (168 KB gzip) |
| | Highest npm downloads (170K/mo) | Limited override granularity |
| | Zod v4 + v3 + mini support | No uniqueness constraints |
| | Immutable builder pattern | No predicate/path-level overrides |
| | Regex-based string generation via randexp | Some open bugs (enum, optional NaN) |
| **External** | **Opportunities** | **Threats** |
| | Expand override system | zodgen's richer customization API |
| | Bundle size reduction | zod-schema-faker's format breadth |

### zod-mocking

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Only tool generating intentionally invalid data | Abandoned since June 2021 |
| | Unique niche for validation testing | Depends on zod@^3.0.0-alpha.33 |
| | | Limited type coverage |
| | | Non-realistic data |
| **External** | **Opportunities** | **Threats** |
| | Concept worth adopting elsewhere | Complete obsolescence |

### zodock

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Lightest bundle (2.2 KB, zero deps) | No customization whatsoever |
| | Broad type coverage for its size (34 types) | No seeding (non-reproducible) |
| | Clean architecture | No Zod v4 support |
| | | Dormant since Feb 2024 |
| **External** | **Opportunities** | **Threats** |
| | Zero-dep niche could be valuable | All maintained competitors surpass it |

## Gap Analysis

Features competitors have that zodgen currently lacks:

| Gap | Source | Impact | Priority | Effort |
|-----|--------|--------|----------|--------|
| Semantic field name detection | zocker | Dramatically improves data realism without user config | High | Medium |
| Locale configuration API | zod-schema-faker, zocker | Important for i18n-heavy projects | Medium | Low |
| Additional string formats (cidr, duration, jwt, e164, hex, hostname, ksuid, xid) | zod-schema-faker, zocker | Covers more real-world schemas out of the box | Medium | Medium |
| Hash format support (md5, sha1, sha256, sha384, sha512) | zod-schema-faker | Niche but completeness signal | Low | Low |
| Invalid/negative data generation | zod-mocking | Unique testing capability — no maintained tool offers this | Medium | High |
| Zod v3 backwards compatibility | all competitors | Unlocks users who haven't migrated yet | Medium | High |
| Zero-dependency lightweight mode | zodock, zod-fixture | Useful for minimal test setups | Low | High |

## Recommendations

### For Parity (must-have for competitive feature set)

1. **Locale configuration API** (Low effort)
   - zodgen already uses @faker-js/faker internally
   - Expose `fixture(schema, { locale: 'de' })` or `.locale('de')` builder method
   - Leverage faker's existing locale system

2. **Additional string formats** (Medium effort)
   - Add generators for: `cidr`, `duration`, `jwt`, `e164`, `hex`, `hostname`, `ksuid`, `xid`
   - These are already available through faker.js — just need format detection + wiring

### For Differentiation (unique competitive advantages)

3. **Semantic field name detection** (High impact, Medium effort)
   - zocker does this but zodgen has a richer foundation: `ctx.path` gives full field name context
   - When no format check exists, infer from field name: `firstName` → `faker.person.firstName()`, `city` → `faker.location.city()`, `phone` → `faker.phone.number()`
   - zodgen's override system means users can easily correct any misdetection
   - This single feature would match zocker's biggest selling point

4. **Invalid data generation mode** (High impact, High effort)
   - No maintained tool offers this — zod-mocking is abandoned
   - Add `.invalid()` method that generates values failing schema validation
   - Use constraint introspection (already in CheckSet) to systematically violate each check
   - Enables testing error handling paths — a unique selling point

5. **Constraint-aware fuzz testing** (Medium impact, High effort)
   - Combine valid + boundary + invalid data: `.fuzz()` generates edge cases
   - Boundary values: min-1, min, max, max+1, empty string, zero, etc.
   - Leverages zodgen's existing deep constraint awareness

### For Market Positioning

6. **Publish to npm** (Blocker)
   - Cannot gain adoption without npm availability
   - zodgen's feature set already exceeds most competitors — distribution is the gap

7. **Benchmark results in README**
   - Run this benchmark suite and publish results
   - Performance data is a strong differentiator for test-heavy projects

8. **Migration guides**
   - Target zod-fixture users (110K downloads, unmaintained) and zodock users (20K downloads, dormant)
   - Show API equivalents and feature improvements

### Priority Roadmap

| Phase | Feature | Why |
|-------|---------|-----|
| 1 | Publish to npm | Distribution blocker |
| 2 | Locale API | Low effort, parity |
| 3 | Semantic field detection | Matches zocker's key advantage |
| 4 | Additional string formats | Format parity with zod-schema-faker |
| 5 | Invalid data generation | Unique differentiator |
| 6 | Migration guides + benchmarks | Market capture from abandoned tools |
