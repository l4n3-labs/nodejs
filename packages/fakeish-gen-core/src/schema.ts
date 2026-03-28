import type { Faker, LocaleDefinition } from '@faker-js/faker';

// --- Constraint types ---

/** Constraints extracted from string schemas (min/max length, format, prefix/suffix). */
export type StringConstraints = {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly exactLength?: number;
  readonly format?: string;
  readonly pattern?: string;
  readonly startsWith?: string;
  readonly endsWith?: string;
  readonly includes?: string;
};

/** Constraints extracted from number schemas (min/max, multipleOf, integer). */
export type NumberConstraints = {
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: boolean;
  readonly exclusiveMaximum?: boolean;
  readonly multipleOf?: number;
  readonly integer?: boolean;
};

/** Constraints extracted from bigint schemas (min/max with optional exclusivity). */
export type BigIntConstraints = {
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: boolean;
  readonly exclusiveMaximum?: boolean;
};

/** Constraints extracted from date schemas (min/max timestamps with optional exclusivity). */
export type DateConstraints = {
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: boolean;
  readonly exclusiveMaximum?: boolean;
};

/** Constraints for collection sizes (arrays, sets, maps). */
export type SizeConstraints = {
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly exactSize?: number;
};

export const emptyStringConstraints: StringConstraints = {};
export const emptyNumberConstraints: NumberConstraints = {};
export const emptyBigIntConstraints: BigIntConstraints = {};
export const emptyDateConstraints: DateConstraints = {};
export const emptySizeConstraints: SizeConstraints = {};

// --- Schema Nodes ---

export type StringNode = { readonly type: 'string'; readonly constraints: StringConstraints };
export type NumberNode = { readonly type: 'number'; readonly constraints: NumberConstraints };
export type BooleanNode = { readonly type: 'boolean' };
export type NullNode = { readonly type: 'null' };
export type UndefinedNode = { readonly type: 'undefined' };
export type VoidNode = { readonly type: 'void' };
export type NeverNode = { readonly type: 'never' };
export type UnknownNode = { readonly type: 'unknown' };
export type AnyNode = { readonly type: 'any' };
export type NaNNode = { readonly type: 'nan' };
export type SymbolNode = { readonly type: 'symbol' };
export type BigIntNode = { readonly type: 'bigint'; readonly constraints: BigIntConstraints };
export type DateNode = { readonly type: 'date'; readonly constraints: DateConstraints };
export type CustomNode = { readonly type: 'custom' };

export type ObjectNode = { readonly type: 'object'; readonly shape: Readonly<Record<string, SchemaNode>> };
export type ArrayNode = { readonly type: 'array'; readonly element: SchemaNode; readonly constraints: SizeConstraints };
export type TupleNode = {
  readonly type: 'tuple';
  readonly items: ReadonlyArray<SchemaNode>;
  readonly rest: SchemaNode | null;
};
export type SetNode = { readonly type: 'set'; readonly element: SchemaNode; readonly constraints: SizeConstraints };
export type MapNode = {
  readonly type: 'map';
  readonly key: SchemaNode;
  readonly value: SchemaNode;
  readonly constraints: SizeConstraints;
};
export type RecordNode = { readonly type: 'record'; readonly key: SchemaNode; readonly value: SchemaNode };

export type UnionNode = { readonly type: 'union'; readonly options: ReadonlyArray<SchemaNode> };
export type LiteralNode = { readonly type: 'literal'; readonly values: ReadonlyArray<unknown> };
export type EnumNode = { readonly type: 'enum'; readonly values: ReadonlyArray<string | number> };

export type IntersectionNode = { readonly type: 'intersection'; readonly left: SchemaNode; readonly right: SchemaNode };

export type NullableNode = { readonly type: 'nullable'; readonly inner: SchemaNode };
export type OptionalNode = { readonly type: 'optional'; readonly inner: SchemaNode };
export type DefaultNode = { readonly type: 'default'; readonly inner: SchemaNode; readonly value: unknown };
export type ReadonlyNode = { readonly type: 'readonly'; readonly inner: SchemaNode };
export type CatchNode = { readonly type: 'catch'; readonly inner: SchemaNode };

export type LazyNode = { readonly type: 'lazy'; readonly resolve: () => SchemaNode };
export type PipeNode = { readonly type: 'pipe'; readonly input: SchemaNode };
export type PromiseNode = { readonly type: 'promise'; readonly inner: SchemaNode };
export type TemplateLiteralNode = {
  readonly type: 'template_literal';
  readonly parts: ReadonlyArray<SchemaNode | string>;
};

/**
 * Discriminated union of all schema node types. Each variant has a `type` field
 * that identifies the node kind. This is the internal representation that generators operate on.
 */
export type SchemaNode =
  | StringNode
  | NumberNode
  | BooleanNode
  | NullNode
  | UndefinedNode
  | VoidNode
  | NeverNode
  | UnknownNode
  | AnyNode
  | NaNNode
  | SymbolNode
  | BigIntNode
  | DateNode
  | CustomNode
  | ObjectNode
  | ArrayNode
  | TupleNode
  | SetNode
  | MapNode
  | RecordNode
  | UnionNode
  | LiteralNode
  | EnumNode
  | IntersectionNode
  | NullableNode
  | OptionalNode
  | DefaultNode
  | ReadonlyNode
  | CatchNode
  | LazyNode
  | PipeNode
  | PromiseNode
  | TemplateLiteralNode;

export type NodeType = SchemaNode['type'];

// --- Node type map (for narrowing in generators) ---

export type NodeTypeMap = {
  readonly string: StringNode;
  readonly number: NumberNode;
  readonly boolean: BooleanNode;
  readonly null: NullNode;
  readonly undefined: UndefinedNode;
  readonly void: VoidNode;
  readonly never: NeverNode;
  readonly unknown: UnknownNode;
  readonly any: AnyNode;
  readonly nan: NaNNode;
  readonly symbol: SymbolNode;
  readonly bigint: BigIntNode;
  readonly date: DateNode;
  readonly custom: CustomNode;
  readonly object: ObjectNode;
  readonly array: ArrayNode;
  readonly tuple: TupleNode;
  readonly set: SetNode;
  readonly map: MapNode;
  readonly record: RecordNode;
  readonly union: UnionNode;
  readonly literal: LiteralNode;
  readonly enum: EnumNode;
  readonly intersection: IntersectionNode;
  readonly nullable: NullableNode;
  readonly optional: OptionalNode;
  readonly default: DefaultNode;
  readonly readonly: ReadonlyNode;
  readonly catch: CatchNode;
  readonly lazy: LazyNode;
  readonly pipe: PipeNode;
  readonly promise: PromiseNode;
  readonly template_literal: TemplateLiteralNode;
};

// --- Generation Context ---

/**
 * Context passed to generator and override functions during fixture generation.
 *
 * @typeParam N - The specific schema node type being generated.
 */
export type GenContext<N extends SchemaNode = SchemaNode> = {
  /** The schema node being generated. */
  readonly node: N;
  /** Path segments from the root to the current field (e.g. `['user', 'address', 'city']`). */
  readonly path: ReadonlyArray<string>;
  /** Current recursion depth (starts at 0). */
  readonly depth: number;
  /** Auto-incrementing counter during `.many()` calls. Always 0 for `.one()`. */
  readonly sequence: number;
  /** Seeded Faker.js instance for generating realistic values. */
  readonly faker: Faker;
  /** Active generator configuration. */
  readonly config: GeneratorConfig;
  /** Recursively generate a value for a child node, optionally appending a key to the path. */
  readonly generate: (node: SchemaNode, key?: string) => unknown;
};

// --- Generator ---

/**
 * A function that produces a value for a given schema node type.
 * Receives a {@link GenContext} narrowed to the specific node type.
 */
export type Generator<N extends SchemaNode = SchemaNode> = (ctx: GenContext<N>) => unknown;

// --- Overrides ---

/**
 * Matches fields for override. A string matches by field name (last path segment);
 * a predicate receives the full {@link GenContext} for custom matching logic.
 */
export type OverrideMatcher = string | ((ctx: GenContext) => boolean);

/** An override definition pairing a {@link OverrideMatcher | matcher} with a generator function. */
export type Override = {
  readonly matcher: OverrideMatcher;
  readonly generate: (ctx: GenContext) => unknown;
};

// --- Derivations ---

/**
 * A derived field definition. After all base fields are generated,
 * `compute` is called with the generated object to produce the value for `key`.
 */
export type Derivation = {
  readonly key: string;
  readonly compute: (obj: Record<string, unknown>) => unknown;
};

// --- Config ---

/**
 * Full internal configuration for the generation engine.
 * Normally constructed via `fixture()` options rather than directly.
 */
export type GeneratorConfig = {
  /** Random seed for reproducible output. `undefined` means non-deterministic. */
  readonly seed: number | undefined;
  /** Maximum recursion depth for lazy/recursive schemas. */
  readonly maxDepth: number;
  /** Faker.js locale definitions for localized data generation. */
  readonly locale: ReadonlyArray<LocaleDefinition>;
  /** When `true`, field names like "email" or "age" trigger realistic value generation. */
  readonly semanticFieldDetection: boolean;
  /** Probability (0-1) that optional fields are present. */
  readonly optionalRate: number;
  /** Probability (0-1) that nullable fields are null. */
  readonly nullRate: number;
  /** Active field overrides applied during generation. */
  readonly overrides: ReadonlyArray<Override>;
  /** Derived field computations applied after base generation. */
  readonly derivations: ReadonlyArray<Derivation>;
  /** Named trait bundles, each containing a set of overrides. */
  readonly traits: Readonly<Record<string, ReadonlyArray<Override>>>;
  /** Custom generators keyed by node type, replacing the built-in defaults. */
  readonly generators: Partial<Readonly<Record<NodeType, Generator>>>;
};

// --- Adapter ---

/**
 * Adapter interface for converting an external schema format (e.g. Zod, JSON Schema)
 * into the internal {@link SchemaNode} tree.
 */
export type SchemaAdapter<TSource> = {
  readonly toNode: (source: TSource) => SchemaNode;
};

// --- Public API Types ---

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
) => FixtureGenerator<T>;

type PredicateOverride<T> = (
  matcher: (ctx: GenContext) => boolean,
  generate: (ctx: GenContext) => unknown,
) => FixtureGenerator<T>;

/**
 * Fixture generator with a chainable, immutable builder API.
 * All configuration methods return a new generator instance.
 *
 * @typeParam T - The type of values this generator produces.
 */
export type FixtureGenerator<T> = {
  /** Generate a single fixture value. */
  readonly one: () => T;
  /** Generate `count` fixture values, optionally enforcing uniqueness on specified fields. */
  readonly many: (count: number, options?: ManyOptions<T>) => ReadonlyArray<T>;
  /** Return a new generator with a fixed random seed for reproducible output. */
  readonly seed: (seed: number) => FixtureGenerator<T>;
  /** Override generation for a specific field (by key or predicate). */
  readonly override: T extends Record<string, unknown>
    ? ObjectOverride<T> & PredicateOverride<T>
    : PredicateOverride<T>;
  /** Override specific sub-fields of a nested object or array-of-objects field. */
  readonly partialOverride: T extends Record<string, unknown>
    ? <K extends ObjectValueKeys<T>>(
        key: K,
        overrides: PartialOverrideGenerators<NonNullable<UnwrapArray<NonNullable<T[K]>>>>,
      ) => FixtureGenerator<T>
    : never;
  /** Replace the default generator for a specific node type (e.g. `'string'`, `'number'`). */
  readonly generator: (nodeType: NodeType, gen: Generator) => FixtureGenerator<T>;
  /** Set the maximum recursion depth for lazy/recursive schemas. */
  readonly maxDepth: (depth: number) => FixtureGenerator<T>;
  /** Set Faker.js locales for localized data generation (e.g. German names, Japanese addresses). */
  readonly locale: (locale: ReadonlyArray<LocaleDefinition>) => FixtureGenerator<T>;
  /** Set the probability (0-1) that optional fields are present. Default: 0.8. */
  readonly optionalRate: (rate: number) => FixtureGenerator<T>;
  /** Set the probability (0-1) that nullable fields are null. Default: 0.2. */
  readonly nullRate: (rate: number) => FixtureGenerator<T>;
  /** Compute a derived field value from other generated fields. */
  readonly derive: T extends Record<string, unknown>
    ? <K extends keyof T & string>(key: K, compute: (obj: T) => T[K]) => FixtureGenerator<T>
    : never;
  /** Define a named, reusable set of field overrides. Activate with `.with()`. */
  readonly trait: T extends Record<string, unknown>
    ? (name: string, overrides: { readonly [K in keyof T & string]?: (ctx: GenContext) => T[K] }) => FixtureGenerator<T>
    : never;
  /** Apply one or more named traits defined via `.trait()`. */
  readonly with: (...traitNames: ReadonlyArray<string>) => FixtureGenerator<T>;
};

/** Configuration options for the `fixture()` entry point. */
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
  readonly derivations?: ReadonlyArray<Derivation>;
  /** Custom generators keyed by node type, replacing the built-in defaults. */
  readonly generators?: GeneratorConfig['generators'];
};
