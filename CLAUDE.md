# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build all packages
pnpm build

# Typecheck all packages
pnpm check

# Run all tests (via Turbo)
pnpm test

# Run all tests directly (faster iteration)
pnpm test:projects
pnpm test:projects:watch    # watch mode

# Run tests for a single package
pnpm --filter @l4n3/poc-utils test

# Lint and format
pnpm lint
pnpm lint:fix
pnpm format
```

## Architecture

**Monorepo** using pnpm workspaces + Turborepo with two workspace roots:

- `packages/*` — libraries and applications
- `configs/*` — shared configurations (TypeScript, Biome, Vitest)

**Tool stack:** TypeScript 7 (tsgo), Vitest, Biome, Lefthook

### Shared configs

Each package extends shared configs rather than defining its own:

- **TypeScript**: `@l4n3/tsconfig/library.json` (extends `base.json`) — strict, ES2024, NodeNext modules
- **Biome**: `@l4n3/biome-config/biome` — single quotes, 2-space indent, 120 char line width
- **Vitest**: `@l4n3/vitest-config` — merged via `mergeConfig(sharedVitestConfig, defineConfig({}))`

### Package structure

```
packages/example/
  src/
    index.ts          # exports
    index.test.ts     # colocated tests
  vitest.config.ts    # merges shared vitest config
  tsconfig.json       # extends @l4n3/tsconfig/library.json
  package.json
```

Build output goes to `dist/`. Packages use `exports` field in package.json for entry points.

## Conventions

- ESM only (`"type": "module"`)
- Tests colocated with source (`src/**/*.test.ts`)
- Workspace dependencies use `workspace:*` protocol
- Pre-commit hooks run Biome check and typecheck via Lefthook

### TypeScript

- Const arrow functions (`const fn = () => {}`) over `function` keyword
- Avoid `as` typecasting; prefer `satisfies` when a type isn't perfectly inferred
- Named exports (`export const`, `export type`) over `export default`
- No barrel files — import directly from source modules

### Testing

- Create mock generator functions (e.g. `createMockUser()`) for data reused across tests
