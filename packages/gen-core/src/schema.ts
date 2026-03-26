import type { Faker, LocaleDefinition } from '@faker-js/faker';

// --- Constraint types ---

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

export type NumberConstraints = {
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: boolean;
  readonly exclusiveMaximum?: boolean;
  readonly multipleOf?: number;
  readonly integer?: boolean;
};

export type BigIntConstraints = {
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: boolean;
  readonly exclusiveMaximum?: boolean;
};

export type DateConstraints = {
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: boolean;
  readonly exclusiveMaximum?: boolean;
};

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

export type GenContext<N extends SchemaNode = SchemaNode> = {
  readonly node: N;
  readonly path: ReadonlyArray<string>;
  readonly depth: number;
  readonly sequence: number;
  readonly faker: Faker;
  readonly config: GeneratorConfig;
  readonly generate: (node: SchemaNode, key?: string) => unknown;
};

// --- Generator ---

export type Generator<N extends SchemaNode = SchemaNode> = (ctx: GenContext<N>) => unknown;

// --- Overrides ---

export type OverrideMatcher = string | ((ctx: GenContext) => boolean);

export type Override = {
  readonly matcher: OverrideMatcher;
  readonly generate: (ctx: GenContext) => unknown;
};

// --- Derivations ---

export type Derivation = {
  readonly key: string;
  readonly compute: (obj: Record<string, unknown>) => unknown;
};

// --- Config ---

export type GeneratorConfig = {
  readonly seed: number | undefined;
  readonly maxDepth: number;
  readonly locale: ReadonlyArray<LocaleDefinition>;
  readonly semanticFieldDetection: boolean;
  readonly optionalRate: number;
  readonly nullRate: number;
  readonly overrides: ReadonlyArray<Override>;
  readonly derivations: ReadonlyArray<Derivation>;
  readonly traits: Readonly<Record<string, ReadonlyArray<Override>>>;
  readonly generators: Partial<Readonly<Record<NodeType, Generator>>>;
};

// --- Adapter ---

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

export type ManyOptions<T> = {
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

export type FixtureGenerator<T> = {
  readonly one: () => T;
  readonly many: (count: number, options?: ManyOptions<T>) => ReadonlyArray<T>;
  readonly seed: (seed: number) => FixtureGenerator<T>;
  readonly override: T extends Record<string, unknown>
    ? ObjectOverride<T> & PredicateOverride<T>
    : PredicateOverride<T>;
  readonly partialOverride: T extends Record<string, unknown>
    ? <K extends ObjectValueKeys<T>>(
        key: K,
        overrides: PartialOverrideGenerators<NonNullable<UnwrapArray<NonNullable<T[K]>>>>,
      ) => FixtureGenerator<T>
    : never;
  readonly generator: (nodeType: NodeType, gen: Generator) => FixtureGenerator<T>;
  readonly maxDepth: (depth: number) => FixtureGenerator<T>;
  readonly locale: (locale: ReadonlyArray<LocaleDefinition>) => FixtureGenerator<T>;
  readonly optionalRate: (rate: number) => FixtureGenerator<T>;
  readonly nullRate: (rate: number) => FixtureGenerator<T>;
  readonly derive: T extends Record<string, unknown>
    ? <K extends keyof T & string>(key: K, compute: (obj: T) => T[K]) => FixtureGenerator<T>
    : never;
  readonly trait: T extends Record<string, unknown>
    ? (name: string, overrides: { readonly [K in keyof T & string]?: (ctx: GenContext) => T[K] }) => FixtureGenerator<T>
    : never;
  readonly with: (...traitNames: ReadonlyArray<string>) => FixtureGenerator<T>;
};

export type FixtureOptions = {
  readonly seed?: number;
  readonly maxDepth?: number;
  readonly locale?: ReadonlyArray<LocaleDefinition>;
  readonly semanticFieldDetection?: boolean;
  readonly optionalRate?: number;
  readonly nullRate?: number;
  readonly derivations?: ReadonlyArray<Derivation>;
  readonly generators?: GeneratorConfig['generators'];
};
