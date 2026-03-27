import type { LocaleDefinition } from '@faker-js/faker';
import type { FixtureGenerator, GenContext, Generator, NodeType } from '@l4n3/gen-core';
import type { z } from 'zod/v4';

// Re-export gen-core types that fakeish users need
export type {
  Derivation,
  FixtureGenerator,
  GenContext,
  Generator,
  GeneratorConfig,
  NodeType,
  Override,
  OverrideMatcher,
  SchemaNode,
} from '@l4n3/gen-core';

// --- Zod-specific public API ---

type UnwrapArray<T> = T extends ReadonlyArray<infer E> ? E : T;

type ObjectValueKeys<T> = {
  [K in keyof T & string]: NonNullable<UnwrapArray<NonNullable<T[K]>>> extends Record<string, unknown> ? K : never;
}[keyof T & string];

type PartialOverrideGenerators<V> = {
  readonly [P in keyof V]?: (ctx: GenContext) => V[P];
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
 * Options for batch generation via `.many()`.
 * Specify `unique` with dot-path field names to enforce uniqueness across generated items.
 */
export type ManyOptions<T> = {
  /** Dot-paths to fields that must be unique across all generated items (e.g. `['id', 'user.email']`). */
  readonly unique?: ReadonlyArray<DotPaths<T>>;
};

type ObjectOverride<T> = <K extends keyof T & string>(
  key: K,
  generate: (ctx: GenContext) => T[K],
) => ZodFixtureGenerator<T>;

type PredicateOverride<T> = (
  matcher: (ctx: GenContext) => boolean,
  generate: (ctx: GenContext) => unknown,
) => ZodFixtureGenerator<T>;

/**
 * The main user-facing API for generating fixture data from Zod schemas.
 * Extends the base {@link FixtureGenerator} with Zod-specific methods:
 * `.for()` to switch schemas, `.invalid()` and `.invalidMany()` for negative testing.
 * All configuration methods return a new generator instance (immutable builder).
 *
 * @typeParam T - The type of values this generator produces, inferred from the Zod schema.
 */
export type ZodFixtureGenerator<T> = Omit<
  FixtureGenerator<T>,
  | 'seed'
  | 'override'
  | 'partialOverride'
  | 'generator'
  | 'maxDepth'
  | 'locale'
  | 'optionalRate'
  | 'nullRate'
  | 'derive'
  | 'trait'
  | 'with'
> & {
  readonly seed: (seed: number) => ZodFixtureGenerator<T>;
  readonly for: <U>(schema: z.ZodType<U>) => ZodFixtureGenerator<U>;
  readonly override: T extends Record<string, unknown>
    ? ObjectOverride<T> & PredicateOverride<T>
    : PredicateOverride<T>;
  readonly partialOverride: T extends Record<string, unknown>
    ? <K extends ObjectValueKeys<T>>(
        key: K,
        overrides: PartialOverrideGenerators<NonNullable<UnwrapArray<NonNullable<T[K]>>>>,
      ) => ZodFixtureGenerator<T>
    : never;
  readonly generator: (nodeType: NodeType, gen: Generator) => ZodFixtureGenerator<T>;
  readonly maxDepth: (depth: number) => ZodFixtureGenerator<T>;
  readonly locale: (locale: ReadonlyArray<LocaleDefinition>) => ZodFixtureGenerator<T>;
  readonly optionalRate: (rate: number) => ZodFixtureGenerator<T>;
  readonly nullRate: (rate: number) => ZodFixtureGenerator<T>;
  readonly derive: T extends Record<string, unknown>
    ? <K extends keyof T & string>(key: K, compute: (obj: T) => T[K]) => ZodFixtureGenerator<T>
    : never;
  readonly trait: T extends Record<string, unknown>
    ? (
        name: string,
        overrides: { readonly [K in keyof T & string]?: (ctx: GenContext) => T[K] },
      ) => ZodFixtureGenerator<T>
    : never;
  readonly with: (...traitNames: ReadonlyArray<string>) => ZodFixtureGenerator<T>;
  readonly invalid: () => unknown;
  readonly invalidMany: (count: number) => ReadonlyArray<unknown>;
};

/** Configuration options for the {@link fixture} entry point. */
export type FixtureOptions = {
  /** Random seed for reproducible output. */
  readonly seed?: number;
  /** Maximum recursion depth for lazy/recursive schemas. Default: 10. */
  readonly maxDepth?: number;
  /** Faker.js locale definitions for localized data generation. */
  readonly locale?: ReadonlyArray<LocaleDefinition>;
  /** Enable field-name-based semantic value generation (e.g. "email" produces emails). Default: `true`. */
  readonly semanticFieldDetection?: boolean;
  /** Probability (0-1) that optional fields are present. Default: 0.8. */
  readonly optionalRate?: number;
  /** Probability (0-1) that nullable fields are null. Default: 0.2. */
  readonly nullRate?: number;
  /** Derived field computations applied after base generation. */
  readonly derivations?: ReadonlyArray<{
    readonly key: string;
    readonly compute: (obj: Record<string, unknown>) => unknown;
  }>;
  /** Custom generators keyed by node type, replacing the built-in defaults. */
  readonly generators?: Partial<Readonly<Record<NodeType, Generator>>>;
};
