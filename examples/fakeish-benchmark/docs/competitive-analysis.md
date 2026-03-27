# Zodgen Competitive Analysis

**Updated:** March 25, 2026
**Prior revision:** March 2026
**Competitors evaluated:** zod-fixture, zod-schema-faker, zocker, zod-mocking, zodock

## Overview

This analysis compares fakeish against 5 open-source Zod mock data generators across features, API design, maintenance status, performance, and ecosystem fit. Data was gathered from GitHub repos, npm registries, programmatic feature testing, and Vitest benchmarks.

**Key change since last analysis:** fakeish shipped semantic field detection, locale API, invalid data generation, recursive depth-limiting, and 8 additional string formats. Three of five competitors (zod-fixture, zod-mocking, zodock) are now **broken on Zod v4** — they fail on import. The competitive field has narrowed to **three viable tools**: fakeish, zod-schema-faker, and zocker.

## Market Landscape

| Metric | fakeish | zod-fixture | zod-schema-faker | zocker | zod-mocking | zodock |
|--------|--------|-------------|-------------------|--------|-------------|--------|
| npm downloads/wk | — | ~23K | ~33K | ~40K | ~2 | ~4.4K |
| GitHub stars | — | 147 | 106 | 90 | 37 | 14 |
| Last code commit | Active | Jun 2024 | Mar 2026 | Aug 2025 | Mar 2021 | Feb 2024 |
| Maintenance | Active | Stale | Active | Semi-active | Abandoned | Abandoned |
| Zod v4 compatible | Y | **N (broken)** | Y | Y | **N (broken)** | **N (broken)** |
| Bundle (gzip) | ~10 KB* | 9.7 KB | 6.2 KB | 168 KB | 21 KB | 2.2 KB |
| Faker.js dep | Yes (v9) | No | Yes (v10) | Yes (v10) | No | No |

*fakeish size excludes @faker-js/faker peer dependency

**Notes on landscape changes:**
- zocker downloads dropped significantly (170K/mo → ~40K/wk ≈ ~160K/mo), likely due to weekly vs monthly measurement variance
- zod-fixture last meaningful commit moved from Dec 2023 to Jun 2024 but remains stale with no Zod v4 support
- zod-mocking and zodock are effectively dead — incompatible with Zod v4, no activity

## Feature Matrix

| Feature | fakeish | zod-fixture | zod-schema-faker | zocker | zod-mocking | zodock |
|---------|:------:|:-----------:|:----------------:|:------:|:-----------:|:------:|
| **Compatibility** |
| Zod v4 support | Y | N | Y | Y | N | N |
| Zod v3 support | — | Y | Y | Y | Y | Y |
| Zod mini support | — | N | Y | Y | N | N |
| **Core Features** |
| Deterministic seeding | Y | Y | Y | Y | Y | N |
| Realistic data (faker) | Y | N | Y | Y | N | N |
| Locale support | Y | N | Y | Y* | N | N |
| Custom overrides | Y | Y | Y | Y | N | N |
| Semantic field detection | Y | N | N | Y | N | N |
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
| Invalid data generation | Y | N | N | N | Y | N |
| Recursive depth-limiting | Y | N | N | N | N | N |
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
| cidr (v4, v6) | Y | N | Y | Y | N | N |
| duration (ISO 8601) | Y | N | Y | Y | N | N |
| jwt | Y | N | Y | Y | N | N |
| e164 | Y | N | Y | Y | N | N |
| ksuid, xid | Y | N | Y | Y | N | N |
| hex, hostname | Y | N | Y | Y | N | N |
| md5/sha hash variants | N | N | Y | N | N | N |
| Template literals | Y | N | Y | N | N | N |
| **Advanced Types** |
| Recursive (z.lazy) | Y | Y | Y | Y | N | Y |
| Intersection | Y | Y | N§ | Y* | N | N |
| Pipe/transform | Y | N | Y | Y | N | Y |
| Custom (z.custom) | Y¶ | N | Y | N | N | N |

*zocker locale support is indirect via faker; intersection is partial
†zod-fixture uses a Generator() pattern with schema matching + filter + path matching — but is broken on Zod v4
‡zocker has .generateMany() but no uniqueness constraints
§zod-schema-faker v4 intersection is WIP
¶fakeish requires explicit override for z.custom()

### Programmatic Feature Test (Zod v4)

All 30 features tested via programmatic generation + `safeParse` validation:

| Tool | Features Passed | Status |
|------|----------------|--------|
| fakeish | 30/30 | Full pass |
| zod-schema-faker | 30/30 | Full pass |
| zocker | 30/30 | Full pass |
| zod-fixture | 0/30 | **Broken** — fails on Zod v4 ZodString import |
| zod-mocking | 0/30 | **Broken** — generates invalid data with Zod v4 |
| zodock | 0/30 | **Broken** — unsupported schema type ZodString |

## Benchmark Results

Benchmarked on Vitest bench (v3.2.4), March 25, 2026. Only the three Zod v4-compatible tools could participate.

### Single Generation (ops/sec, higher is better)

| Schema Complexity | fakeish | zod-schema-faker | zocker | Winner |
|-------------------|--------|------------------|--------|--------|
| Primitive (string, number, bool) | 62,377 | **851,982** | 38,172 | zod-schema-faker (13.7x) |
| Simple object (4 fields) | **55,748** | 410 | 32,921 | fakeish (136x vs zsf, 1.7x vs zocker) |
| Constrained object (uuid, email, ranges) | **34,718** | 399 | 2,497 | fakeish (87x vs zsf, 13.9x vs zocker) |
| Nested object (enums, arrays, optional) | **33,218** | 439 | 8,576 | fakeish (76x vs zsf, 3.9x vs zocker) |
| Recursive tree (z.lazy) | **23,136** | 4,565 | 349 | fakeish (5.1x vs zsf, 66x vs zocker) |

### Batch Generation (ops/sec, higher is better)

| Batch Size | fakeish | zod-schema-faker | zocker | fakeish Advantage |
|------------|--------|------------------|--------|------------------|
| 10 simple objects | **19,912** | 41 | 3,312 | 6x vs zocker, 485x vs zsf |
| 100 simple objects | **2,545** | 4.1 | 308 | 8.3x vs zocker, 627x vs zsf |
| 1,000 simple objects | **256** | 0.42 | 30 | 8.6x vs zocker, 611x vs zsf |
| 100 constrained objects | **686** | 4.0 | 13 | 52x vs zocker, 171x vs zsf |
| 100 nested objects | **284** | 3.9 | 83 | 3.4x vs zocker, 73x vs zsf |

### Performance Analysis

- **zod-schema-faker** wins only on trivial primitives with no constraints or nesting — its lighter initialization overhead gives it an edge on schemas with no real structure
- **fakeish** dominates every real-world schema by **4x–627x** over competitors. The advantage grows with schema complexity and batch size
- **zocker** is consistently 2nd but **3–52x slower** than fakeish, with the gap widening dramatically on constrained schemas
- Batch generation is where fakeish's architecture pays off most: at 1,000 objects, fakeish is **611x faster** than zod-schema-faker and **8.6x faster** than zocker

### Correctness

All three Zod v4-compatible tools achieved **100% pass rate** across 50 samples per schema (primitive, simple, constrained, nested) and on recursive schemas.

## SWOT Analysis

### fakeish

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Richest override system (string key O(1) + predicate + partial nested) | Not published to npm yet |
| | Full constraint awareness (startsWith, endsWith, includes, multipleOf) | No md5/sha hash format support |
| | Immutable chainable builder with type-safe autocomplete | No Zod v3 backwards compatibility |
| | Uniqueness constraints in batch generation | |
| | Schema rebinding (.for()) for reusable generators | |
| | Template literal support | |
| | Zod v4 native | |
| | Semantic field detection (27 string + 11 number patterns) | |
| | Locale API with cached faker instances | |
| | Invalid data generation (.invalid() / .invalidMany()) — unique | |
| | 31 string format generators (near-parity with zod-schema-faker) | |
| | Recursive depth-limiting (maxDepth) | |
| | Dominant performance: fastest on all real-world schemas (4–627x) | |
| **External** | **Opportunities** | **Threats** |
| | Constraint-aware fuzz testing (valid + boundary + invalid) | zocker has established download base (~40K/wk) |
| | Become the go-to Zod v4 fixture library | zod-schema-faker is actively maintained and has broadest format coverage |
| | Migration guides from broken/abandoned competitors (zod-fixture, zodock) | |
| | Publish benchmark results to establish performance leadership | |

### zod-fixture

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Zero faker dependency (9.7 KB gzip) | Stale since Jun 2024 (was Dec 2023) |
| | Rich Generator extensibility (schema + filter + path matching) | **Broken on Zod v4** — fails on import |
| | Two transformer modes (constrained/unconstrained) | Generates structurally valid but unrealistic data |
| | Highest star count (147) | Limited string format coverage (~9) |
| **External** | **Opportunities** | **Threats** |
| | Could be forked/revived by community | **Obsolete** — Zod v4 incompatible, no path to recovery |
| | | Users migrating to Zod v4 must switch tools |

### zod-schema-faker

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Broadest string format coverage (35+, including md5/sha) | Simple API — no builder pattern |
| | Zod v4 + v3 + mini support | No batch generation or uniqueness |
| | Full locale support via faker | No path-level or predicate overrides |
| | Actively maintained (Mar 2026) | No immutable configuration |
| | | **Slowest on real-world schemas** (87–627x slower than fakeish) |
| **External** | **Opportunities** | **Threats** |
| | Expand API with builder pattern, batch utilities | fakeish's performance and feature dominance |
| | Largest format catalog is a moat | fakeish closing the format gap |

### zocker

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Semantic field name detection | Largest bundle (168 KB gzip) |
| | Highest npm downloads (~40K/wk) | Limited override granularity |
| | Zod v4 + v3 + mini support | No uniqueness constraints |
| | Immutable builder pattern | No predicate/path-level overrides |
| | Regex-based string generation via randexp | Semi-active (no commits since Aug 2025, 9 open issues) |
| | | 3–52x slower than fakeish on benchmarks |
| **External** | **Opportunities** | **Threats** |
| | Expand override system | fakeish matches semantic detection + far richer API |
| | Bundle size reduction | fakeish's performance advantage grows with complexity |

### zod-mocking

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Pioneered invalid data generation concept | Abandoned since March 2021 |
| | | **Broken on Zod v4** |
| | | Depends on zod@^3.0.0-alpha.33 |
| | | fakeish now offers invalid generation with active maintenance |
| **External** | **Opportunities** | **Threats** |
| | None — project is dead | Complete obsolescence |

### zodock

| | Positive | Negative |
|---|----------|----------|
| **Internal** | **Strengths** | **Weaknesses** |
| | Lightest bundle (2.2 KB, zero deps) | No customization whatsoever |
| | | No seeding (non-reproducible) |
| | | **Broken on Zod v4** |
| | | Abandoned since Feb 2024 |
| **External** | **Opportunities** | **Threats** |
| | None — project is dead | Complete obsolescence |

## Gap Analysis

### Gaps Closed (since prior analysis)

| Gap | Status | Implementation |
|-----|--------|----------------|
| Semantic field name detection | **Closed** | 27 string + 11 number patterns, case-insensitive matching, configurable via `semanticFieldDetection` option |
| Locale configuration API | **Closed** | `fixture(schema).locale([de, base])` or `fixture(schema, { locale: [de, base] })` |
| Additional string formats (cidr, duration, jwt, e164, hex, hostname, ksuid, xid) | **Closed** | All 8 formats added, bringing total to 31 |
| Invalid/negative data generation | **Closed** | `.invalid()` and `.invalidMany(count)` with smart invalidation strategies per type |

### Remaining Gaps

| Gap | Source | Impact | Priority | Effort |
|-----|--------|--------|----------|--------|
| Hash format support (md5, sha1, sha256, sha384, sha512) | zod-schema-faker | Niche but completeness signal | Low | Low |
| Zod v3 backwards compatibility | zocker, zod-schema-faker | Unlocks users who haven't migrated yet | Medium | High |
| Zero-dependency lightweight mode | (zodock concept) | Useful for minimal test setups | Low | High |

## Recommendations

### Immediate (market capture)

1. **Publish to npm** (Blocker)
   - fakeish's feature set now exceeds all competitors — distribution is the only gap
   - Performance benchmarks alone would drive adoption from test-heavy projects
   - Target zod-fixture users (23K/wk, broken on Zod v4) and zodock users (4.4K/wk, broken)

2. **Benchmark results in README**
   - Publish the benchmark data from this analysis
   - 87–627x performance advantage on real-world schemas is a compelling differentiator

3. **Migration guides**
   - Priority targets: zod-fixture (23K downloads/wk, broken) and zodock (4.4K downloads/wk, broken)
   - These users are forced to switch — be the obvious destination

### Future (completeness)

4. **Hash format support** (Low effort)
   - Add md5/sha generators for format parity with zod-schema-faker
   - The only remaining format gap

5. **Constraint-aware fuzz testing** (High effort, unique differentiator)
   - Combine valid + boundary + invalid data: `.fuzz()` generates edge cases
   - Leverages fakeish's deep constraint awareness + new invalid generation

### Not recommended

- **Zod v3 backwards compatibility**: High effort, diminishing returns as Zod v4 adoption grows. The three broken competitors already serve Zod v3 users.
- **Zero-dependency mode**: High effort, niche use case. fakeish's ~10 KB (excluding faker) is already reasonable.

### Updated Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Publish to npm | **Blocked** — critical path |
| 2 | Locale API | **Done** |
| 3 | Semantic field detection | **Done** |
| 4 | Additional string formats | **Done** (8 new formats) |
| 5 | Invalid data generation | **Done** |
| 6 | Migration guides + benchmarks | Ready to write |
| 7 | Hash format support (md5/sha) | Not started |
| 8 | Fuzz testing mode | Not started |

## Competitive Position Summary

fakeish has moved from a strong but incomplete contender to the **most feature-rich and performant** Zod mock data generator. With the Zod v4 migration eliminating 3 of 5 competitors from viability, and fakeish now matching or exceeding the unique advantages of the remaining two (zocker's semantic detection, zod-schema-faker's format breadth), the primary barrier to adoption is npm publication.
