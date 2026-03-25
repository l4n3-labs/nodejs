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
  readonly generate: <U>(schema: z.ZodType<U>, key?: string) => U;
};

// --- Generator ---

export type Generator = <T>(ctx: GenContext<T>) => T;

// --- Public API ---

type ObjectOverride<T> = <K extends keyof T & string>(
  key: K,
  generate: (ctx: GenContext<T[K]>) => T[K],
) => FixtureGenerator<T>;

type PredicateOverride<T> = (
  matcher: (ctx: GenContext<unknown>) => boolean,
  generate: (ctx: GenContext<unknown>) => unknown,
) => FixtureGenerator<T>;

type ObjectValueKeys<T> = {
  [K in keyof T & string]: NonNullable<T[K]> extends Record<string, unknown> ? K : never;
}[keyof T & string];

type PartialOverrideGenerators<V> = {
  readonly [P in keyof V]?: (ctx: GenContext<V[P]>) => V[P];
};

type DotPaths<T, Prefix extends string = ''> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]:
          | `${Prefix}${K}`
          | (NonNullable<T[K]> extends Record<string, unknown> ? DotPaths<NonNullable<T[K]>, `${Prefix}${K}.`> : never);
      }[keyof T & string]
    : never;

export type ManyOptions<T> = {
  readonly unique?: ReadonlyArray<DotPaths<T>>;
};

export type FixtureGenerator<T> = {
  readonly one: () => T;
  readonly many: (count: number, options?: ManyOptions<T>) => ReadonlyArray<T>;
  readonly seed: (seed: number) => FixtureGenerator<T>;
  readonly for: <U>(schema: z.ZodType<U>) => FixtureGenerator<U>;
  readonly override: T extends Record<string, unknown>
    ? ObjectOverride<T> & PredicateOverride<T>
    : PredicateOverride<T>;
  readonly partialOverride: T extends Record<string, unknown>
    ? <K extends ObjectValueKeys<T>>(
        key: K,
        overrides: PartialOverrideGenerators<NonNullable<T[K]>>,
      ) => FixtureGenerator<T>
    : never;
};

export type FixtureOptions = {
  readonly seed?: number;
};
