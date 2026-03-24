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

// --- Check types ---

export type ZodCheckDef = z.core.$ZodCheckDef;

// --- Check type map ---
// Maps Zod v4 check names to their typed def interfaces.
// Used by CheckSet.find to return narrowed types instead of a generic base.

type CheckDefMap = {
  readonly greater_than: z.core.$ZodCheckGreaterThanDef;
  readonly less_than: z.core.$ZodCheckLessThanDef;
  readonly multiple_of: z.core.$ZodCheckMultipleOfDef;
  readonly number_format: z.core.$ZodCheckNumberFormatDef;
  readonly string_format: z.core.$ZodCheckStringFormatDef;
  readonly min_length: z.core.$ZodCheckMinLengthDef;
  readonly max_length: z.core.$ZodCheckMaxLengthDef;
  readonly length_equals: z.core.$ZodCheckLengthEqualsDef;
  readonly min_size: z.core.$ZodCheckMinSizeDef;
  readonly max_size: z.core.$ZodCheckMaxSizeDef;
  readonly size_equals: z.core.$ZodCheckSizeEqualsDef;
};

// --- Check Queries ---

export type CheckSet = {
  readonly has: (check: string) => boolean;
  readonly find: <K extends string>(
    check: K,
  ) => (K extends keyof CheckDefMap ? CheckDefMap[K] : z.core.$ZodCheckDef) | undefined;
  readonly all: () => ReadonlyArray<z.core.$ZodCheckDef>;
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
