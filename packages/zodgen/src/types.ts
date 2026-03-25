import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';

// --- Config ---

export type GeneratorConfig = {
  readonly seed: number | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: overrides handle heterogeneous schema types at runtime
  readonly overrides: ReadonlyArray<Override<any>>;
  readonly generators: Partial<Readonly<{ [D in ZodDefType]: Generator<D> }>>;
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

export type GenContext<T, D extends ZodDefType = ZodDefType> = {
  readonly schema: z.ZodType<T>;
  readonly def: ResolvedDef<D>;
  readonly path: ReadonlyArray<string>;
  readonly depth: number;
  readonly faker: Faker;
  readonly config: GeneratorConfig;
  readonly checks: CheckSet;
  readonly generate: <U>(schema: z.ZodType<U>, key?: string) => U;
};

// --- Def type map ---
// Maps each ZodDefType string literal to its corresponding Zod def interface.

export type ZodDefType = z.core.$ZodTypeDef['type'];

export type ZodDefMap = {
  readonly string: z.core.$ZodStringDef;
  readonly number: z.core.$ZodNumberDef;
  readonly boolean: z.core.$ZodBooleanDef;
  readonly bigint: z.core.$ZodBigIntDef;
  readonly symbol: z.core.$ZodSymbolDef;
  readonly date: z.core.$ZodDateDef;
  readonly object: z.core.$ZodObjectDef;
  readonly array: z.core.$ZodArrayDef;
  readonly tuple: z.core.$ZodTupleDef;
  readonly set: z.core.$ZodSetDef;
  readonly map: z.core.$ZodMapDef;
  readonly record: z.core.$ZodRecordDef;
  readonly literal: z.core.$ZodLiteralDef<z.core.util.Literal>;
  readonly enum: z.core.$ZodEnumDef;
  readonly union: z.core.$ZodUnionDef;
  readonly intersection: z.core.$ZodIntersectionDef;
  readonly nullable: z.core.$ZodNullableDef;
  readonly optional: z.core.$ZodOptionalDef;
  readonly default: z.core.$ZodDefaultDef;
  readonly readonly: z.core.$ZodReadonlyDef;
  readonly catch: z.core.$ZodCatchDef;
  readonly lazy: z.core.$ZodLazyDef;
  readonly promise: z.core.$ZodPromiseDef;
  readonly pipe: z.core.$ZodPipeDef;
  readonly null: z.core.$ZodNullDef;
  readonly undefined: z.core.$ZodUndefinedDef;
  readonly void: z.core.$ZodVoidDef;
  readonly never: z.core.$ZodNeverDef;
  readonly unknown: z.core.$ZodUnknownDef;
  readonly any: z.core.$ZodAnyDef;
  readonly nan: z.core.$ZodNaNDef;
  readonly custom: z.core.$ZodCustomDef;
  readonly template_literal: z.core.$ZodTemplateLiteralDef;
};

export type ResolvedDef<D extends ZodDefType> = D extends keyof ZodDefMap ? ZodDefMap[D] : z.core.$ZodTypeDef;

// --- Generator ---

export type Generator<D extends ZodDefType = ZodDefType> = <T>(ctx: GenContext<T, D>) => T;

// --- Public API ---

type ObjectOverride<T> = <K extends keyof T & string>(
  key: K,
  generate: (ctx: GenContext<T[K]>) => T[K],
) => FixtureGenerator<T>;

type PredicateOverride<T> = (
  matcher: (ctx: GenContext<unknown>) => boolean,
  generate: (ctx: GenContext<unknown>) => unknown,
) => FixtureGenerator<T>;

type UnwrapArray<T> = T extends ReadonlyArray<infer E> ? E : T;

type ObjectValueKeys<T> = {
  [K in keyof T & string]: NonNullable<UnwrapArray<NonNullable<T[K]>>> extends Record<string, unknown> ? K : never;
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
        overrides: PartialOverrideGenerators<NonNullable<UnwrapArray<NonNullable<T[K]>>>>,
      ) => FixtureGenerator<T>
    : never;
  readonly generator: <D extends ZodDefType>(defType: D, gen: Generator<D>) => FixtureGenerator<T>;
};

export type FixtureOptions = {
  readonly seed?: number;
  readonly generators?: GeneratorConfig['generators'];
};
