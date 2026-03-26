# Multi-Schema Support Design

**Date:** 2026-03-26
**Status:** Draft

## Context

zodgen is currently tightly coupled to Zod v4 internals (`._zod.def`, check system, 32+ type definitions). While it's the most feature-rich and performant Zod mock data generator, it only serves the Zod v4 ecosystem.

The goal is to support **JSON Schema** and **OpenAPI** as input formats — enabling fixture generation from API specs, schema registries, and any library that exports JSON Schema (TypeBox, ArkType, Valibot). This also positions the core engine as a reusable foundation for future schema adapters.

**Key discovery:** Zod v4/mini share the same `._zod.def` internals, so mini support is free. Zod v3 uses completely different internals (`._def`) and is not worth supporting (high effort, diminishing returns as v4 adoption grows, broken competitors already serve v3 users).

## Architecture

### Package Structure

```
packages/
  gen-core/              # Schema-agnostic generation engine
  zodgen/                # Zod v4/mini adapter (refactored from current)
  jsonschema-gen/        # JSON Schema + OpenAPI adapter (new)
```

### gen-core — Schema-Agnostic Generation Engine

Owns the generation pipeline: schema node types, constraint types, generation context, dispatch/resolve, built-in generators, override system, batch generation, seeding/faker lifecycle, and the immutable FixtureGenerator builder.

### zodgen — Zod v4/mini Adapter

Thin wrapper that converts Zod schemas to `SchemaNode` lazily and re-exports `fixture()` pre-wired with the Zod adapter. Registers Zod-specific generator overrides (semantic field detection, template literals, invalid generation).

Public API is unchanged — zero breaking changes for existing users.

### jsonschema-gen — JSON Schema + OpenAPI Adapter

Converts JSON Schema objects to `SchemaNode`. Adds OpenAPI schema extraction as a sub-module.

## SchemaNode Type System

The core abstraction — a discriminated union normalizing schema structure across libraries.

### Node Types

```typescript
type NodeType =
  // Primitives
  | 'string' | 'number' | 'boolean' | 'null'
  | 'undefined' | 'void' | 'any' | 'unknown' | 'never'
  | 'bigint' | 'symbol' | 'nan'
  // Containers
  | 'object' | 'array' | 'tuple' | 'set' | 'map' | 'record'
  // Unions & selection
  | 'union' | 'literal' | 'enum'
  // Composition
  | 'intersection'
  // Wrappers
  | 'nullable' | 'optional' | 'default' | 'readonly' | 'catch'
  // Special
  | 'lazy' | 'pipe' | 'promise' | 'custom' | 'template_literal'

type SchemaNode = { type: NodeType } & NodeData
```

### Concrete Node Shapes

```typescript
// Primitives
type StringNode = { type: 'string'; constraints: StringConstraints }
type NumberNode = { type: 'number'; constraints: NumberConstraints }
type BooleanNode = { type: 'boolean' }
type NullNode = { type: 'null' }

// Containers
type ObjectNode = { type: 'object'; shape: Record<string, SchemaNode> }
type ArrayNode = { type: 'array'; element: SchemaNode; constraints: SizeConstraints }
type TupleNode = { type: 'tuple'; items: ReadonlyArray<SchemaNode>; rest?: SchemaNode }
type SetNode = { type: 'set'; element: SchemaNode; constraints: SizeConstraints }
type MapNode = { type: 'map'; key: SchemaNode; value: SchemaNode; constraints: SizeConstraints }
type RecordNode = { type: 'record'; key: SchemaNode; value: SchemaNode }

// Unions & selection
type UnionNode = { type: 'union'; options: ReadonlyArray<SchemaNode> }
type LiteralNode = { type: 'literal'; values: ReadonlyArray<unknown> }
type EnumNode = { type: 'enum'; values: ReadonlyArray<string | number> }

// Composition
type IntersectionNode = { type: 'intersection'; left: SchemaNode; right: SchemaNode }

// Wrappers
type NullableNode = { type: 'nullable'; inner: SchemaNode }
type OptionalNode = { type: 'optional'; inner: SchemaNode }
type DefaultNode = { type: 'default'; inner: SchemaNode; value: unknown }
type ReadonlyNode = { type: 'readonly'; inner: SchemaNode }
type CatchNode = { type: 'catch'; inner: SchemaNode }

// Special
type LazyNode = { type: 'lazy'; resolve: () => SchemaNode }
type PipeNode = { type: 'pipe'; input: SchemaNode }
type PromiseNode = { type: 'promise'; inner: SchemaNode }
type CustomNode = { type: 'custom' }
type TemplateLiteralNode = { type: 'template_literal'; parts: ReadonlyArray<SchemaNode | string> }
```

### Constraint Types

Normalized — not Zod-shaped, not JSON-Schema-shaped. Maps cleanly to both.

```typescript
type StringConstraints = {
  minLength?: number
  maxLength?: number
  exactLength?: number
  format?: string           // 'email' | 'url' | 'uuid' | 'ipv4' | 'jwt' | etc.
  pattern?: string           // regex string
  startsWith?: string
  endsWith?: string
  includes?: string
}

type NumberConstraints = {
  minimum?: number
  maximum?: number
  exclusiveMinimum?: boolean
  exclusiveMaximum?: boolean
  multipleOf?: number
  integer?: boolean
}

type SizeConstraints = {
  minSize?: number
  maxSize?: number
  exactSize?: number
}
```

**Mapping from Zod checks:**
- `greater_than { value, inclusive }` → `{ minimum: value, exclusiveMinimum: !inclusive }`
- `less_than { value, inclusive }` → `{ maximum: value, exclusiveMaximum: !inclusive }`
- `string_format { format }` → `{ format }`
- `min_length { value }` → `{ minLength: value }` or `{ minSize: value }`
- `starts_with { value }` → `{ startsWith: value }`

**Mapping from JSON Schema:**
- Direct 1:1 for most keywords (`minLength`, `maxLength`, `pattern`, `format`, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`)
- `type: "integer"` → `{ integer: true }`
- `minItems`/`maxItems` → `{ minSize, maxSize }`

## Adapter Interface

```typescript
type SchemaAdapter<TSource> = {
  readonly toNode: (source: TSource) => SchemaNode
}
```

### Zod Adapter

Wraps Zod schemas lazily — child nodes created on access, not upfront.

```typescript
// Simplified illustration
const zodAdapter: SchemaAdapter<z.ZodType> = {
  toNode: (schema) => {
    const def = schema._zod.def
    switch (def.type) {
      case 'string':
        return { type: 'string', constraints: extractStringConstraints(schema) }
      case 'object':
        return {
          type: 'object',
          shape: Object.fromEntries(
            Object.entries(def.shape).map(([k, v]) => [k, zodAdapter.toNode(v)])
          ),
        }
      // ... 30+ cases
    }
  },
}
```

**Lazy child resolution:** Object shapes and array elements use getter properties or lazy wrappers so that deeply nested schemas aren't traversed until the generator actually needs them.

**Zod-specific generators:** Semantic field detection, template literal generation, and invalid data generation are registered as custom generator overrides by the Zod adapter — they augment the core generators rather than living in gen-core.

### JSON Schema Adapter

Maps JSON Schema keywords to SchemaNode directly.

```typescript
const jsonSchemaAdapter: SchemaAdapter<JsonSchema> = {
  toNode: (schema) => {
    if (schema.$ref) return { type: 'lazy', resolve: () => resolveRef(schema.$ref) }
    if (schema.oneOf) return { type: 'union', options: schema.oneOf.map(toNode) }
    if (schema.allOf) return reduceAllOf(schema.allOf)

    switch (schema.type) {
      case 'string':
        return {
          type: 'string',
          constraints: {
            minLength: schema.minLength,
            maxLength: schema.maxLength,
            format: schema.format,
            pattern: schema.pattern,
          },
        }
      case 'object':
        return {
          type: 'object',
          shape: Object.fromEntries(
            Object.entries(schema.properties ?? {}).map(([k, v]) => {
              const node = toNode(v)
              // If not in required array, wrap in optional
              return [k, schema.required?.includes(k) ? node : { type: 'optional', inner: node }]
            })
          ),
        }
      // ...
    }
  },
}
```

**$ref resolution:** Uses `LazyNode` with a resolve function that looks up the referenced schema in a definitions map. Handles circular references through the same depth-limiting mechanism the core already provides.

**allOf handling:** Merges object shapes, intersects constraints. Falls back to `IntersectionNode` for non-object allOf.

### OpenAPI Adapter

Layers on JSON Schema adapter. Extracts schemas from OpenAPI spec structure.

```typescript
import { fromOpenAPI } from '@l4n3/jsonschema-gen/openapi'

// Parse OpenAPI spec → map of schema name → fixture generator
const schemas = fromOpenAPI(openapiSpec)
const pet = schemas['Pet'].seed(42).one()
const order = schemas['CreateOrderRequest'].one()
```

**Scope:** OpenAPI 3.1 only (full JSON Schema Draft 2020-12 compatibility). OpenAPI 3.0 and 2.0 have JSON Schema divergences that aren't worth handling.

**Implementation:**
1. Extract `components/schemas` from spec
2. Build a definitions map for `$ref` resolution
3. Pass each schema through the JSON Schema adapter
4. Return `Record<string, FixtureGenerator>` keyed by schema name

## Generation Context (Refactored)

```typescript
type GenContext<N extends SchemaNode = SchemaNode> = {
  readonly node: N                                    // replaces ctx.def
  readonly path: ReadonlyArray<string>
  readonly depth: number
  readonly sequence: number
  readonly faker: Faker
  readonly config: GeneratorConfig
  readonly generate: (node: SchemaNode, key?: string) => unknown
}
```

**Key change:** `ctx.def` (Zod-typed) becomes `ctx.node` (SchemaNode-typed). Generators access constraints directly (`ctx.node.constraints.minLength`) instead of through CheckSet queries (`ctx.checks.find('min_length')`).

## Generator Migration

Generators are refactored to work on SchemaNode. This is mostly a simplification.

**Before (Zod-coupled):**
```typescript
const generateString = (ctx: GenContext<unknown, 'string'>) => {
  const minCheck = ctx.checks.find('min_length')
  const maxCheck = ctx.checks.find('max_length')
  const min = minCheck?.value ?? 0
  const max = maxCheck?.value ?? 20
  // ...
}
```

**After (schema-agnostic):**
```typescript
const generateString = (ctx: GenContext<StringNode>) => {
  const { minLength = 0, maxLength = 20 } = ctx.node.constraints
  // ...
}
```

### What Stays in zodgen (Not Core) — Initially

- **Semantic field detection** — uses `ctx.path` which is adapter-agnostic, but stays in zodgen initially since it's already there and working. Good candidate to move to gen-core in Phase 5.
- **Template literal generation** — Zod-specific type with no JSON Schema equivalent. The `template_literal` node type exists in SchemaNode for Zod, but JSON Schema adapter will never produce it.
- **Invalid data generation** — needs access to the original Zod schema for `safeParse` validation. Could be generalized later with a validator callback.
- **`.for()` schema rebinding** — Zod-specific (rebind to a different Zod schema). zodgen wraps this to convert the new schema through the adapter.

These are registered by the Zod adapter as generator overrides that layer on top of the core generators.

## Type Safety

For zodgen, `FixtureGenerator<T>` infers `T` from the Zod schema — this is preserved. The Zod adapter extracts `z.infer<TSchema>` and passes it as the generic parameter.

For jsonschema-gen, `T` is `unknown` since JSON Schema objects don't carry TypeScript type information. Users can provide a type parameter: `fixture<MyType>(jsonSchema)` for type-safe output if they have a corresponding TypeScript type.

## Public API

### zodgen (unchanged)

```typescript
import { fixture } from '@l4n3/zodgen'

const user = fixture(UserSchema).seed(42).one()
const users = fixture(UserSchema).many(100, { unique: ['email'] })
```

### jsonschema-gen

```typescript
import { fixture } from '@l4n3/jsonschema-gen'

// From JSON Schema object
const user = fixture({
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    age: { type: 'integer', minimum: 0, maximum: 120 },
    email: { type: 'string', format: 'email' },
  },
  required: ['name', 'email'],
}).seed(42).one()
```

### OpenAPI

```typescript
import { fromOpenAPI } from '@l4n3/jsonschema-gen/openapi'

const schemas = fromOpenAPI(openapiSpec)
const pet = schemas['Pet'].seed(42).one()
const pets = schemas['Pet'].many(10)
```

## Implementation Phases

### Phase 1: Extract gen-core

**Goal:** Extract the schema-agnostic generation engine from zodgen into `packages/gen-core`.

**Files to create in gen-core:**
- `src/schema.ts` — SchemaNode discriminated union and constraint types
- `src/context.ts` — GenContext working on SchemaNode (adapted from zodgen's context.ts)
- `src/resolve.ts` — Dispatch + override system (adapted from zodgen's resolve.ts)
- `src/generators/` — All built-in generators refactored to work on SchemaNode
- `src/fixture.ts` — FixtureGenerator builder (adapted from zodgen's fixture.ts)
- `src/index.ts` — Public exports

**Key refactoring:**
- Replace `ctx.def` with `ctx.node` throughout generators
- Replace `ctx.checks.find(...)` with direct constraint property access
- Replace `ZodDefType` dispatch string with `NodeType`
- Extract faker caching and seeding to gen-core

**Estimated effort:** Medium (most code moves with mechanical refactoring)

### Phase 2: Refactor zodgen as adapter

**Goal:** Make zodgen a thin adapter over gen-core.

**Files to modify/create in zodgen:**
- `src/adapter.ts` — `zodAdapter: SchemaAdapter<z.ZodType>` implementation
- `src/index.ts` — Re-export `fixture()` pre-wired with Zod adapter
- `src/semantic.ts` — Semantic field detection (stays in zodgen)
- `src/template-literal.ts` — Template literal generator (stays in zodgen)
- `src/invalid.ts` — Invalid generation (stays in zodgen)

**Key changes:**
- `fixture(schema)` internally calls `zodAdapter.toNode(schema)` then passes to gen-core's `fixture()`
- Zod-specific generators registered as overrides via `config.generators`

**Estimated effort:** Medium (adapter conversion logic + ensuring no regressions)

### Phase 3: JSON Schema adapter

**Goal:** Build `packages/jsonschema-gen` supporting JSON Schema Draft 2020-12.

**Files to create:**
- `src/adapter.ts` — JSON Schema → SchemaNode conversion
- `src/ref-resolver.ts` — `$ref` resolution with circular reference handling
- `src/fixture.ts` — Pre-wired `fixture()` export
- `src/index.ts` — Public exports

**JSON Schema features to support:**
- All primitive types (string, number, integer, boolean, null)
- Object (properties, required, additionalProperties)
- Array (items, minItems, maxItems, uniqueItems)
- Composition (oneOf → union, anyOf → union, allOf → intersection)
- References ($ref, $defs)
- String constraints (minLength, maxLength, pattern, format)
- Number constraints (minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf)
- Enum and const
- Nullable (type: [T, "null"])

**Estimated effort:** Low-Medium (well-defined spec, direct property mapping)

### Phase 4: OpenAPI schema extraction

**Goal:** Add OpenAPI 3.1 support as a sub-module of jsonschema-gen.

**Files to create:**
- `src/openapi.ts` — Parse OpenAPI spec, extract `components/schemas`, build ref resolver, return `Record<string, FixtureGenerator>`

**Estimated effort:** Low (thin layer over JSON Schema adapter)

### Phase 5 (Future): Backfill advanced features

- Move semantic field detection to gen-core (make it adapter-agnostic)
- Move invalid generation to gen-core
- Add JSON Schema `pattern` (regex) → string generation
- Add `additionalProperties` support for JSON Schema objects

## Verification

### After Phase 1-2 (gen-core + zodgen refactor)
- All existing zodgen tests pass unchanged
- Benchmark performance within 10% of current (no regression from adapter layer)
- `pnpm check` passes across all packages

### After Phase 3-4 (JSON Schema + OpenAPI)
- New test suite covering all JSON Schema Draft 2020-12 keywords
- Test: generate from JSON Schema → validate with ajv
- Test: extract schemas from a real OpenAPI spec (e.g., Petstore) → generate valid fixtures
- Benchmark: JSON Schema generation performance comparable to zodgen core

## Risks

| Risk | Mitigation |
|------|------------|
| SchemaNode interface doesn't cover all Zod edge cases | Start with the 33 types already implemented; add new node types if needed |
| Performance regression from adapter indirection | Lazy node construction, benchmark after Phase 2 |
| JSON Schema $ref cycles cause infinite loops | LazyNode + existing maxDepth mechanism handles this |
| OpenAPI 3.0 users expect support | Document OpenAPI 3.1 only; 3.0 has JSON Schema divergences |

## Future Adapter Opportunities

Once the core exists, adding adapters is low effort:

| Library | Approach | Effort |
|---------|----------|--------|
| TypeBox | Already JSON Schema — pass through jsonschema-gen | Trivial |
| ArkType | Use `.toJsonSchema()` → jsonschema-gen | Low |
| Valibot | Use `@valibot/to-json-schema` → jsonschema-gen | Low |
| Yup | Custom adapter via `.describe()` API | Medium |
| Zod v3 | Custom adapter via `._def` | High (not recommended) |
