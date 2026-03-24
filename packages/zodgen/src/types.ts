import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';

// --- Config ---

export type GeneratorConfig = {
  readonly seed: number | undefined;
  readonly overrides: ReadonlyArray<Override>;
};

// --- Overrides ---

export type Override = {
  readonly matcher: OverrideMatcher;
  readonly generate: (ctx: GenContext) => unknown;
};

export type OverrideMatcher = string | ((ctx: GenContext) => boolean);

// --- Check internals ---
// Zod v4 checks are objects with a non-enumerable `_zod` property.
// The check discrimination field is `_zod.def.check` (e.g. 'min_length', 'max_length',
// 'greater_than', 'less_than', 'string_format', 'number_format', etc.)
// String format checks (email, url, uuid, regex) use check: 'string_format' with a `format` field.

export type ZodCheckDef = {
  readonly check: string;
  readonly [key: string]: unknown;
};

export type ZodCheckInternal = {
  readonly _zod: {
    readonly def: ZodCheckDef;
  };
};

// --- Check Queries ---

export type CheckSet = {
  readonly has: (check: string) => boolean;
  readonly find: (check: string) => ZodCheckDef | undefined;
  readonly all: () => ReadonlyArray<ZodCheckDef>;
};

// --- Generation Context ---

export type GenContext = {
  readonly schema: z.ZodType;
  readonly path: ReadonlyArray<string>;
  readonly depth: number;
  readonly faker: Faker;
  readonly config: GeneratorConfig;
  readonly checks: CheckSet;
  readonly generate: <T>(schema: z.ZodType<T>, key?: string) => T;
};

// --- Generator ---

export type Generator = (ctx: GenContext) => unknown;

// --- Transform ---

export type Transform = (config: GeneratorConfig) => GeneratorConfig;

// --- Public API ---

export type FixtureGenerator = {
  readonly one: <T>(schema: z.ZodType<T>) => T;
  readonly many: <T>(schema: z.ZodType<T>, count: number) => ReadonlyArray<T>;
};

export type FixtureOptions = {
  readonly seed?: number;
};
