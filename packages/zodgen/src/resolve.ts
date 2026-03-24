import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import { createContext } from './context.js';
import { generators } from './generators/registry.js';
import type { GenContext, GeneratorConfig, OverrideMatcher } from './types.js';

const matchOverride = <T>(matcher: OverrideMatcher<T>, path: ReadonlyArray<string>, ctx: GenContext<T>): boolean => {
  if (typeof matcher === 'string') return path.at(-1) === matcher;
  return matcher(ctx);
};

export const resolve = <T>(
  schema: z.ZodType<T>,
  config: GeneratorConfig,
  path: ReadonlyArray<string>,
  depth: number,
  faker: Faker,
): T => {
  const generate = (childSchema: z.ZodType<T>, childKey?: string): T =>
    resolve(childSchema, config, childKey !== undefined ? [...path, childKey] : path, depth + 1, faker);

  const ctx = createContext(schema, config, path, depth, faker, generate);

  const matchedOverride = config.overrides.find((o) => matchOverride(o.matcher, path, ctx));
  if (matchedOverride) return matchedOverride.generate(ctx);

  const defType = schema._zod.def.type;
  const generator = generators.get(defType);
  if (!generator) throw new Error(`No generator for type: ${defType}`);
  return generator(ctx);
};
