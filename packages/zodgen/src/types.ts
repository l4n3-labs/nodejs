import type { Faker, LocaleDefinition } from '@faker-js/faker';
import type { z } from 'zod/v4';

// --- Config ---

/**
 * Full configuration for the fixture generator, controlling seed, locale, generation rates,
 * overrides, derivations, traits, and custom type generators.
 *
 * Typically constructed internally from {@link FixtureOptions} passed to {@link fixture}.
 * Custom generators receive this as part of {@link GenContext}.
 *
 * @see {@link FixtureOptions} for the user-facing subset of these options.
 */
export type GeneratorConfig = {
  /** Random seed for deterministic generation. `undefined` produces random output each run. */
  readonly seed: number | undefined;
  /** Maximum recursion depth for nested/recursive schemas. */
  readonly maxDepth: number;
  /** Faker locale definitions controlling the language and region of generated data. */
  readonly locale: ReadonlyArray<LocaleDefinition>;
  /** When `true`, field names like `email` or `firstName` produce semantically appropriate values. */
  readonly semanticFieldDetection: boolean;
  /** Probability (0–1) that an optional field is present in generated output. */
  readonly optionalRate: number;
  /** Probability (0–1) that a nullable field is `null` in generated output. */
  readonly nullRate: number;
  // biome-ignore lint/suspicious/noExplicitAny: overrides handle heterogeneous schema types at runtime
  /** Ordered list of override rules applied during generation. */
  readonly overrides: ReadonlyArray<Override<any>>;
  /** Derived field computations applied after initial generation. */
  readonly derivations: ReadonlyArray<Derivation>;
  // biome-ignore lint/suspicious/noExplicitAny: traits store heterogeneous override sets
  /** Named sets of overrides that can be activated with {@link FixtureGenerator.with}. */
  readonly traits: Readonly<Record<string, ReadonlyArray<Override<any>>>>;
  /** Custom generators keyed by Zod definition type, overriding the built-in defaults. */
  readonly generators: Partial<Readonly<{ [D in ZodDefType]: Generator<D> }>>;
};

// --- Overrides ---

/**
 * A rule that overrides generation for fields matching a given condition.
 *
 * @template T - The type of value this override produces.
 *
 * @example
 * ```ts
 * const emailOverride: Override<string> = {
 *   matcher: 'email',
 *   generate: (ctx) => ctx.faker.internet.email(),
 * };
 * ```
 *
 * @see {@link OverrideMatcher} for how matching works.
 */
export type Override<T> = {
  /** A field name string or predicate function that determines when this override applies. */
  readonly matcher: OverrideMatcher<T>;
  /** Generator function invoked when the matcher matches. */
  readonly generate: (ctx: GenContext<T>) => T;
};

/**
 * Determines which fields an {@link Override} applies to.
 *
 * - When a `string`, matches fields whose path ends with that key.
 * - When a function, receives the {@link GenContext} and returns `true` to apply the override.
 *
 * @template T - The type of value the associated override produces.
 */
export type OverrideMatcher<T> = string | ((ctx: GenContext<T>) => boolean);

// --- Derivations ---

/**
 * A derived field computation applied after initial fixture generation.
 * Derivations let you compute field values from other fields in the generated object.
 *
 * @see {@link FixtureGenerator.derive} for the chainable API.
 */
export type Derivation = {
  /** The object key to set with the computed value. */
  readonly key: string;
  /** Computes the derived value from the fully generated object. */
  readonly compute: (obj: Record<string, unknown>) => unknown;
};

// --- Check types ---

/**
 * The base definition type for Zod v4 validation checks (e.g., min length, max value).
 * Re-exported from Zod core for use in custom generators via {@link CheckSet}.
 */
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

/**
 * A read-only interface for querying Zod validation checks on a schema.
 * Available in {@link GenContext} so custom generators can inspect constraints
 * like min/max length, numeric bounds, and string formats.
 *
 * @example
 * ```ts
 * const stringGen = <T>(ctx: GenContext<T, 'string'>) => {
 *   const minLen = ctx.checks.find('min_length');
 *   const maxLen = ctx.checks.find('max_length');
 *   // Generate a string respecting the constraints...
 * };
 * ```
 */
export type CheckSet = {
  /** Returns `true` if the schema has a check with the given name. */
  readonly has: (check: string) => boolean;
  /**
   * Finds a check by name and returns its typed definition, or `undefined` if not present.
   * Known check names (e.g., `'min_length'`, `'greater_than'`) return narrowed types.
   */
  readonly find: <K extends string>(
    check: K,
  ) => (K extends keyof CheckDefMap ? CheckDefMap[K] : z.core.$ZodCheckDef) | undefined;
  /** Returns all checks on the schema as a readonly array. */
  readonly all: () => ReadonlyArray<z.core.$ZodCheckDef>;
};

// --- Generation Context ---

/**
 * Context passed to custom generator functions and override generators.
 * Provides access to the current schema, faker instance, path information,
 * and a recursive `generate` function for producing nested values.
 *
 * @template T - The type being generated at this point in the schema tree.
 * @template D - The Zod definition type, defaults to {@link ZodDefType}.
 *
 * @example
 * ```ts
 * const customStringGen = <T>(ctx: GenContext<T, 'string'>) => {
 *   if (ctx.checks.has('string_format')) {
 *     return ctx.faker.internet.email() as T;
 *   }
 *   return ctx.faker.lorem.word() as T;
 * };
 * ```
 */
export type GenContext<T, D extends ZodDefType = ZodDefType> = {
  /** The Zod schema being generated. */
  readonly schema: z.ZodType<T>;
  /** The resolved Zod definition, narrowed by `D` when a specific type is known. */
  readonly def: ResolvedDef<D>;
  /** The dot-path from the schema root to the current field (e.g., `['address', 'street']`). */
  readonly path: ReadonlyArray<string>;
  /** Current recursion depth (0 at the root). */
  readonly depth: number;
  /** The index of the current item when generating via {@link FixtureGenerator.many}. */
  readonly sequence: number;
  /** The Faker instance, seeded and locale-configured per the generator config. */
  readonly faker: Faker;
  /** The full generator configuration. */
  readonly config: GeneratorConfig;
  /** Query interface for the schema's validation checks. */
  readonly checks: CheckSet;
  /** Recursively generates a value for a nested schema. Optionally pass a field key for path tracking. */
  readonly generate: <U>(schema: z.ZodType<U>, key?: string) => U;
};

// --- Def type map ---

/**
 * Union of all Zod v4 definition type string literals (e.g., `'string'`, `'number'`, `'object'`).
 * Used to key custom generators in {@link GeneratorConfig.generators}.
 */
export type ZodDefType = z.core.$ZodTypeDef['type'];

/**
 * Maps each {@link ZodDefType} string literal to its corresponding Zod definition interface.
 * Used internally by {@link ResolvedDef} to narrow the `def` field in {@link GenContext}.
 */
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

/**
 * Resolves a {@link ZodDefType} to its concrete Zod definition interface via {@link ZodDefMap}.
 * Falls back to the base `$ZodTypeDef` when `D` is not a known key.
 *
 * @template D - The Zod definition type to resolve.
 */
export type ResolvedDef<D extends ZodDefType> = D extends keyof ZodDefMap ? ZodDefMap[D] : z.core.$ZodTypeDef;

// --- Generator ---

/**
 * A generator function for a specific Zod definition type.
 * Register custom generators via {@link FixtureGenerator.generator} or {@link FixtureOptions.generators}.
 *
 * @template D - The Zod definition type this generator handles (e.g., `'string'`, `'number'`).
 *
 * @example
 * ```ts
 * const myStringGen: Generator<'string'> = (ctx) => {
 *   return ctx.faker.lorem.sentence();
 * };
 * ```
 */
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

/**
 * Options for {@link FixtureGenerator.many} controlling batch generation behavior.
 *
 * @template T - The type of fixtures being generated.
 */
export type ManyOptions<T> = {
  /** Dot-paths of fields that must be unique across generated items (e.g., `['email', 'id']`). */
  readonly unique?: ReadonlyArray<DotPaths<T>>;
};

/**
 * A chainable fixture generator bound to a Zod schema. Created by calling {@link fixture}.
 * All methods return a new generator (immutable builder pattern) except `one`, `many`,
 * `invalid`, and `invalidMany` which produce values.
 *
 * @template T - The TypeScript type inferred from the Zod schema.
 *
 * @example
 * ```ts
 * import { z } from 'zod/v4';
 * import { fixture } from '@l4n3/zodgen';
 *
 * const User = z.object({ name: z.string(), age: z.number().min(18) });
 *
 * const gen = fixture(User).seed(42);
 * const user = gen.one();        // { name: '...', age: 42 }
 * const users = gen.many(10);    // 10 unique users
 * ```
 */
export type FixtureGenerator<T> = {
  /** Generates a single fixture value. */
  readonly one: () => T;
  /** Generates `count` fixture values, optionally enforcing uniqueness on specified fields. */
  readonly many: (count: number, options?: ManyOptions<T>) => ReadonlyArray<T>;
  /** Returns a new generator with a fixed random seed for deterministic output. */
  readonly seed: (seed: number) => FixtureGenerator<T>;
  /** Returns a new generator bound to a different Zod schema, preserving all configuration. */
  readonly for: <U>(schema: z.ZodType<U>) => FixtureGenerator<U>;
  /**
   * Adds an override rule. For object schemas, accepts either a field key string or a predicate.
   * For non-object schemas, only predicate overrides are available.
   */
  readonly override: T extends Record<string, unknown>
    ? ObjectOverride<T> & PredicateOverride<T>
    : PredicateOverride<T>;
  /**
   * Overrides individual properties of a nested object field.
   * Only available when `T` is a record type with nested object fields.
   */
  readonly partialOverride: T extends Record<string, unknown>
    ? <K extends ObjectValueKeys<T>>(
        key: K,
        overrides: PartialOverrideGenerators<NonNullable<UnwrapArray<NonNullable<T[K]>>>>,
      ) => FixtureGenerator<T>
    : never;
  /** Registers a custom generator for a specific Zod definition type (e.g., `'string'`, `'number'`). */
  readonly generator: <D extends ZodDefType>(defType: D, gen: Generator<D>) => FixtureGenerator<T>;
  /** Sets the maximum recursion depth for nested or recursive schemas. */
  readonly maxDepth: (depth: number) => FixtureGenerator<T>;
  /** Sets the Faker locale definitions for region-specific generated data. */
  readonly locale: (locale: ReadonlyArray<LocaleDefinition>) => FixtureGenerator<T>;
  /** Sets the probability (0–1) that optional fields are present. */
  readonly optionalRate: (rate: number) => FixtureGenerator<T>;
  /** Sets the probability (0–1) that nullable fields are `null`. */
  readonly nullRate: (rate: number) => FixtureGenerator<T>;
  /**
   * Adds a derived field that is computed from the generated object after initial generation.
   * Only available when `T` is a record type.
   */
  readonly derive: T extends Record<string, unknown>
    ? <K extends keyof T & string>(key: K, compute: (obj: T) => T[K]) => FixtureGenerator<T>
    : never;
  /**
   * Defines a named trait — a reusable set of field overrides that can be activated with {@link FixtureGenerator.with}.
   * Only available when `T` is a record type.
   */
  readonly trait: T extends Record<string, unknown>
    ? (
        name: string,
        overrides: { readonly [K in keyof T & string]?: (ctx: GenContext<T[K]>) => T[K] },
      ) => FixtureGenerator<T>
    : never;
  /** Activates one or more named traits previously defined with {@link FixtureGenerator.trait}. */
  readonly with: (...traitNames: ReadonlyArray<string>) => FixtureGenerator<T>;
  /** Generates a single intentionally invalid value for negative testing. */
  readonly invalid: () => unknown;
  /** Generates `count` intentionally invalid values for negative testing. */
  readonly invalidMany: (count: number) => ReadonlyArray<unknown>;
};

/**
 * User-facing options for creating a fixture generator via {@link fixture}.
 * All fields are optional and fall back to sensible defaults.
 *
 * @example
 * ```ts
 * const gen = fixture(schema, {
 *   seed: 42,
 *   maxDepth: 3,
 *   optionalRate: 0.8,
 * });
 * ```
 *
 * @see {@link GeneratorConfig} for the full internal configuration.
 */
export type FixtureOptions = {
  /** Random seed for deterministic generation. */
  readonly seed?: number;
  /** Maximum recursion depth for nested schemas. */
  readonly maxDepth?: number;
  /** Faker locale definitions for region-specific data. */
  readonly locale?: ReadonlyArray<LocaleDefinition>;
  /** Enable field-name-based semantic generation (e.g., `email` fields produce emails). */
  readonly semanticFieldDetection?: boolean;
  /** Probability (0–1) that optional fields are present. */
  readonly optionalRate?: number;
  /** Probability (0–1) that nullable fields are `null`. */
  readonly nullRate?: number;
  /** Derived field computations applied after initial generation. */
  readonly derivations?: ReadonlyArray<Derivation>;
  /** Custom generators keyed by Zod definition type. */
  readonly generators?: GeneratorConfig['generators'];
};
