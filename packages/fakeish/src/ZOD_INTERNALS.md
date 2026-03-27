# Zod v4 Internal Structure Reference

Discovered by running `zod-internals.test.ts` against Zod v4 (4.3.6).

## Schema def access

All Zod schemas expose internals via `schema._zod.def`. The `def` is a plain object.

## Schema type discrimination

`schema._zod.def.type` is a string literal. Discovered values:

| `def.type`         | Zod API                                      | Notes                                            |
|--------------------|----------------------------------------------|--------------------------------------------------|
| `'string'`         | `z.string()`                                 |                                                  |
| `'number'`         | `z.number()`                                 |                                                  |
| `'boolean'`        | `z.boolean()`                                |                                                  |
| `'bigint'`         | `z.bigint()`                                 |                                                  |
| `'date'`           | `z.date()`                                   |                                                  |
| `'symbol'`         | `z.symbol()`                                 |                                                  |
| `'undefined'`      | `z.undefined()`                              |                                                  |
| `'null'`           | `z.null()`                                   |                                                  |
| `'any'`            | `z.any()`                                    |                                                  |
| `'unknown'`        | `z.unknown()`                                |                                                  |
| `'never'`          | `z.never()`                                  |                                                  |
| `'void'`           | `z.void()`                                   |                                                  |
| `'literal'`        | `z.literal('hello')`                         | `def.values: unknown[]`                          |
| `'enum'`           | `z.enum(['a', 'b'])`                         | `def.entries: Record<string, string>`            |
| `'object'`         | `z.object({...})`                            | `def.shape: Record<string, ZodType>`             |
| `'array'`          | `z.array(z.string())`                        | `def.element: ZodType`                           |
| `'tuple'`          | `z.tuple([z.string(), z.number()])`          | `def.items: ZodType[]`, `def.rest: ZodType\|null`|
| `'union'`          | `z.union([...])`                             | `def.options: ZodType[]`                         |
| `'union'`          | `z.discriminatedUnion('type', [...])`        | also `def.discriminator`, `def.inclusive`        |
| `'intersection'`   | `z.intersection(a, b)`                       | `def.left: ZodType`, `def.right: ZodType`        |
| `'record'`         | `z.record(z.string(), z.number())`           | `def.keyType: ZodType`, `def.valueType: ZodType` |
| `'map'`            | `z.map(z.string(), z.number())`              | `def.keyType: ZodType`, `def.valueType: ZodType` |
| `'set'`            | `z.set(z.string())`                          | `def.valueType: ZodType`                         |
| `'optional'`       | `z.optional(z.string())`                     | `def.innerType: ZodType`                         |
| `'nullable'`       | `z.nullable(z.string())`                     | `def.innerType: ZodType`                         |
| `'default'`        | `z.string().default('hello')`                | `def.innerType: ZodType`, `def.defaultValue`     |
| `'catch'`          | `z.string().catch('fallback')`               | `def.innerType: ZodType`, `def.catchValue`       |
| `'readonly'`       | `z.object({}).readonly()`                    | `def.innerType: ZodType`                         |
| `'promise'`        | `z.promise(z.string())`                      | `def.innerType: ZodType`                         |
| `'lazy'`           | `z.lazy(() => z.string())`                   | `def.getter: () => ZodType`                      |
| `'pipe'`           | `z.string().pipe(z.number())`                | `def.in: ZodType`, `def.out: ZodType`            |
| `'pipe'`           | `z.string().transform((s) => s.length)`      | Transform is sugar for pipe; same def shape      |
| `'template_literal'` | `z.templateLiteral([...])`               | `def.parts: unknown[]`                           |
| `'custom'`         | `z.custom<string>()`                         | `def.check: fn`, `def.fn`, `def.abort`           |
| `'string'`         | `z.string().refine(...)`                     | Refine adds a check to existing schema's `def.checks` |
| `'string'`         | `z.string().brand('MyBrand')`               | Brand is purely a type-level operation; def unchanged |

**Important notes:**
- `z.string().transform(fn)` produces `def.type === 'pipe'` (not `'transform'`)
- `z.string().refine(fn)` produces `def.type === 'string'` (refine adds a check to the schema's checks array)
- `z.string().brand('X')` produces `def.type === 'string'` (no runtime change)
- `z.discriminatedUnion(...)` produces `def.type === 'union'` (same as regular union)

## Checks structure

Schema checks live in `schema._zod.def.checks: unknown[]`.

**CRITICAL**: Check objects have `_zod` as a **non-enumerable** property. This means:
- `JSON.stringify(check)` returns `'{}'`
- `Object.keys(check)` returns `[]`
- The actual check data is at `check._zod.def`

Access checks like:
```typescript
const checks = schema._zod.def.checks // unknown[]
for (const check of checks) {
  const def = (check as ZodCheckInternal)._zod.def
  // def.check is the discrimination string
}
```

## Check discrimination field

The field `check._zod.def.check` is a string discriminating the check kind:

### String checks

| `_zod.def.check`    | Fields                                        | Zod API                    |
|---------------------|-----------------------------------------------|----------------------------|
| `'min_length'`      | `minimum: number`                             | `.min(n)`                  |
| `'max_length'`      | `maximum: number`                             | `.max(n)`                  |
| `'string_format'`   | `format: string`, `pattern?: RegExp`          | `.email()`, `.url()`, `.uuid()`, `.regex()`, etc. |
| `'string_format'`   | `format: 'includes'`, `includes: string`      | `.includes(s)` — NOTE: uses string_format, not separate check |
| `'string_format'`   | `format: 'starts_with'`, `prefix: string`     | `.startsWith(s)` — NOTE: uses string_format |
| `'string_format'`   | `format: 'ends_with'`, `suffix: string`       | `.endsWith(s)` — NOTE: uses string_format |
| `'length_equals'`   | `length: number`                              | `.length(n)`               |
| `'string_format'`   | `format: 'regex'`, `pattern: RegExp`          | `.regex(re)`               |

### String format values (for `check === 'string_format'`)

The `format` sub-field distinguishes string format checks:
- `'email'`, `'url'`, `'uuid'`, `'cuid'`, `'cuid2'`, `'ulid'`, `'nanoid'`
- `'ip'`, `'ipv4'`, `'ipv6'`
- `'datetime'`, `'date'`, `'time'`, `'duration'`
- `'base64'`, `'base64url'`
- `'regex'` (custom regex via `.regex()`)
- `'jwt'`
- `'emoji'`
- `'ascii'`, `'lowercase'`, `'uppercase'`
- `'trim'`, `'normalize'`, `'slugify'`

### Number checks

| `_zod.def.check`    | Fields                                        | Zod API                    |
|---------------------|-----------------------------------------------|----------------------------|
| `'greater_than'`    | `value: number`, `inclusive: boolean`         | `.min(n)` / `.gte(n)` / `.gt(n)` / `.positive()` |
| `'less_than'`       | `value: number`, `inclusive: boolean`         | `.max(n)` / `.lte(n)` / `.lt(n)` / `.negative()` |
| `'number_format'`   | `format: 'safeint'`                           | `.int()` — NOTE: format is 'safeint', not 'int' |
| `'multiple_of'`     | `value: number`                               | `.multipleOf(n)`           |
| `'finite'`          | —                                             | `.finite()`                |

### Date checks

Date uses the same `'greater_than'` / `'less_than'` checks as number but with `value: Date`.

### Array checks

| `_zod.def.check`    | Fields                        | Zod API          |
|---------------------|-------------------------------|------------------|
| `'min_length'`      | `minimum: number`             | `.min(n)`        |
| `'max_length'`      | `maximum: number`             | `.max(n)`        |
| `'length_equals'`   | `length: number`              | `.length(n)`     |

## Inner schema field names per wrapper type

| `def.type`     | Inner field name  |
|----------------|-------------------|
| `'optional'`   | `def.innerType`   |
| `'nullable'`   | `def.innerType`   |
| `'default'`    | `def.innerType`   |
| `'catch'`      | `def.innerType`   |
| `'readonly'`   | `def.innerType`   |
| `'promise'`    | `def.innerType`   |

## Special field names

| `def.type`      | Field           | Type                         |
|-----------------|-----------------|------------------------------|
| `'object'`      | `def.shape`     | `Record<string, ZodType>`    |
| `'array'`       | `def.element`   | `ZodType`                    |
| `'tuple'`       | `def.items`     | `ZodType[]`                  |
| `'tuple'`       | `def.rest`      | `ZodType \| null`            |
| `'union'`       | `def.options`   | `ZodType[]`                  |
| `'intersection'`| `def.left`      | `ZodType`                    |
| `'intersection'`| `def.right`     | `ZodType`                    |
| `'record'`      | `def.keyType`   | `ZodType`                    |
| `'record'`      | `def.valueType` | `ZodType`                    |
| `'map'`         | `def.keyType`   | `ZodType`                    |
| `'map'`         | `def.valueType` | `ZodType`                    |
| `'set'`         | `def.valueType` | `ZodType`                    |
| `'lazy'`        | `def.getter`    | `() => ZodType`              |
| `'pipe'`        | `def.in`        | `ZodType`                    |
| `'pipe'`        | `def.out`       | `ZodType`                    |
| `'literal'`     | `def.values`    | `unknown[]` (array of values)|
| `'enum'`        | `def.entries`   | `Record<string, string>`     |
| `'default'`     | `def.defaultValue` | `unknown` or `() => unknown` |
| `'catch'`       | `def.catchValue` | `unknown` or `() => unknown` |

## How to read checks safely

```typescript
const getRawChecks = (schema: z.ZodType): ReadonlyArray<ZodCheckDef> => {
  const def = schema._zod.def as { checks?: unknown[] }
  if (!Array.isArray(def.checks)) return []
  return def.checks.map((c) => (c as ZodCheckInternal)._zod.def)
}
```
