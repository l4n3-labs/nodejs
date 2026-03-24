# @l4n3/logger — Design Spec

## Context

The monorepo has no logging library. All output currently uses `console.log` in example files. A reusable, structured logger package will provide consistent logging across all packages with sensible defaults and room to grow.

## Package Location

`utils/logger/` — a new workspace root (`utils/*` added to `pnpm-workspace.yaml`). Published as `@l4n3/logger`.

## API

### `createLogger(options): Logger`

Factory that returns a configured pino instance.

```typescript
type LoggerOptions = {
  readonly name: string;                          // required — identifies log source
  readonly level?: pino.Level;                    // defaults to 'info'
  readonly transports?: ReadonlyArray<TransportTarget>; // custom transports (replaces defaults)
  readonly options?: pino.LoggerOptions;          // additional pino options pass-through
};
```

**Default transport behavior:**
- `NODE_ENV === 'production'` → pino default (JSON to stdout)
- Otherwise → `pino-pretty` (human-readable, colorized)

When `transports` is provided, it replaces the default transport entirely.

### `createChildLogger(parent, bindings): Logger`

Creates a child logger with additional context bindings merged into every log line.

```typescript
const logger = createLogger({ name: 'api' });
const reqLogger = createChildLogger(logger, { requestId: 'abc-123' });
reqLogger.info('handling request'); // every log line includes requestId
```

### Exported Types

- `Logger` — re-export of pino's `Logger` type
- `TransportTarget` — shape for transport config entries (`{ target: string; options?: Record<string, unknown>; level?: string }`)
- `LoggerOptions` — the options type for `createLogger`

## Dependencies

- `pino` — runtime dependency
- `pino-pretty` — runtime dependency (dev transport)

## File Structure

```
utils/logger/
  src/
    index.ts           # public exports
    logger.ts          # createLogger, createChildLogger
    transports.ts      # default transport resolution
    types.ts           # LoggerOptions, TransportTarget
    logger.test.ts     # tests
  package.json
  tsconfig.json
  biome.json
  vitest.config.ts
```

## Tests

- `createLogger` returns a pino instance with correct `name` and `level`
- Default level is `'info'` when not specified
- Custom level is respected
- Default transport uses pino-pretty when `NODE_ENV` is not `'production'`
- Default transport uses JSON when `NODE_ENV` is `'production'`
- Custom `transports` array overrides defaults
- `createChildLogger` returns a child with merged bindings
- Additional pino options are passed through
