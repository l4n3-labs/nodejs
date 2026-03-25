import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import { createContext } from './context.js';
import { generators } from './generators/registry.js';
import type { GenContext, GeneratorConfig, Override } from './types.js';

type IndexedOverrides = {
  readonly byKey: ReadonlyMap<string, Override<unknown>>;
  readonly predicates: ReadonlyArray<Override<unknown>>;
};

const indexCache = new WeakMap<ReadonlyArray<Override<unknown>>, IndexedOverrides>();

const indexOverrides = (overrides: ReadonlyArray<Override<unknown>>): IndexedOverrides => {
  const cached = indexCache.get(overrides);
  if (cached) return cached;

  const byKey = new Map<string, Override<unknown>>();
  const predicates: Array<Override<unknown>> = [];

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

export const resolve = <T>(
  schema: z.ZodType<T>,
  config: GeneratorConfig,
  path: ReadonlyArray<string>,
  depth: number,
  faker: Faker,
): T => {
  const generate = <U>(childSchema: z.ZodType<U>, childKey?: string): U =>
    resolve(childSchema, config, childKey !== undefined ? [...path, childKey] : path, depth + 1, faker);

  const indexed = indexOverrides(config.overrides);

  // O(1) string key lookup
  const lastKey = path.at(-1);
  const keyMatch = lastKey !== undefined ? indexed.byKey.get(lastKey) : undefined;
  if (keyMatch) {
    const ctx = createContext(schema, config, path, depth, faker, generate);
    return keyMatch.generate(ctx) as T;
  }

  // Only scan predicates (typically few or none)
  if (indexed.predicates.length > 0) {
    const ctx = createContext(schema, config, path, depth, faker, generate);
    const predicateMatch = indexed.predicates.find((o) => (o.matcher as (ctx: GenContext<unknown>) => boolean)(ctx));
    if (predicateMatch) return predicateMatch.generate(ctx) as T;
  }

  const defType = schema._zod.def.type;
  const generator = generators.get(defType);
  if (!generator) throw new Error(`No generator for type: ${defType}`);

  // Defer context creation until the generator needs it (most common path)
  const ctx = createContext(schema, config, path, depth, faker, generate);
  return generator(ctx);
};
