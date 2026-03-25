import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';

// --- Config ---

export type GeneratorConfig = {
  readonly seed: number | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: overrides handle heterogeneous schema types at runtime
  readonly overrides: ReadonlyArray<Override<any>>;
};

// --- Overrides ---

export type Override<T> = {
  readonly matcher: OverrideMatcher<T>;
  readonly generate: (ctx: GenContext<T>) => T;
};

export type OverrideMatcher<T> = string | ((ctx: GenContext<T>) => boolean);

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

export type GenContext<T> = {
  readonly schema: z.ZodType<T>;
  readonly path: ReadonlyArray<string>;
  readonly depth: number;
  readonly faker: Faker;
  readonly config: GeneratorConfig;
  readonly checks: CheckSet;
  readonly generate: (schema: z.ZodType<T>, key?: string) => T;
};

// --- Generator ---

export type Generator = <T>(ctx: GenContext<T>) => T;

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
