import type { Faker } from '@faker-js/faker';
import { generators } from './generators/registry.js';
import type { GenContext, Generator, GeneratorConfig, Override, SchemaNode } from './schema.js';

type IndexedOverrides = {
  readonly byKey: ReadonlyMap<string, Override>;
  readonly predicates: ReadonlyArray<Override>;
};

const indexCache = new WeakMap<ReadonlyArray<Override>, IndexedOverrides>();

const indexOverrides = (overrides: ReadonlyArray<Override>): IndexedOverrides => {
  const cached = indexCache.get(overrides);
  if (cached) return cached;

  const byKey = new Map<string, Override>();
  const predicates: Array<Override> = [];

  for (const o of overrides) {
    if (typeof o.matcher === 'string') {
      if (!byKey.has(o.matcher)) byKey.set(o.matcher, o);
    } else {
      predicates.push(o);
    }
  }

  const indexed: IndexedOverrides = { byKey, predicates };
  indexCache.set(overrides, indexed);
  return indexed;
};

const createContext = <N extends SchemaNode>(
  node: N,
  config: GeneratorConfig,
  path: ReadonlyArray<string>,
  depth: number,
  faker: Faker,
  generate: (node: SchemaNode, key?: string) => unknown,
  sequence: number,
): GenContext<N> => ({
  node,
  path,
  depth,
  sequence,
  faker,
  config,
  generate,
});

export const resolve = (
  node: SchemaNode,
  config: GeneratorConfig,
  path: ReadonlyArray<string>,
  depth: number,
  faker: Faker,
  sequence = 0,
): unknown => {
  const generate = (childNode: SchemaNode, childKey?: string): unknown =>
    resolve(childNode, config, childKey !== undefined ? [...path, childKey] : path, depth + 1, faker, sequence);

  const indexed = indexOverrides(config.overrides);

  // O(1) string key lookup
  const lastKey = path.at(-1);
  const keyMatch = lastKey !== undefined ? indexed.byKey.get(lastKey) : undefined;
  if (keyMatch) {
    const ctx = createContext(node, config, path, depth, faker, generate, sequence);
    return keyMatch.generate(ctx);
  }

  // Only scan predicates (typically few or none)
  if (indexed.predicates.length > 0) {
    const ctx = createContext(node, config, path, depth, faker, generate, sequence);
    const predicateMatch = indexed.predicates.find((o) => (o.matcher as (ctx: GenContext) => boolean)(ctx));
    if (predicateMatch) return predicateMatch.generate(ctx);
  }

  const { type } = node;
  // biome-ignore lint/suspicious/noExplicitAny: dynamic lookup produces an intersection type that can't be narrowed statically
  const generator = (config.generators[type] as Generator<any> | undefined) ?? generators.get(type);
  if (!generator) throw new Error(`No generator for type: ${type}`);

  const ctx = createContext(node, config, path, depth, faker, generate, sequence);
  return generator(ctx);
};
