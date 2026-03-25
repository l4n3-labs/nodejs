import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import type { CheckSet, GenContext, GeneratorConfig } from './types.js';

const checkSetCache = new WeakMap<z.ZodType, CheckSet>();

const extractChecks = <S extends z.ZodType>(schema: S): ReadonlyArray<z.core.$ZodCheck> =>
  (schema.def.checks ?? []) as ReadonlyArray<z.core.$ZodCheck>;

export const createCheckSet = (checks: ReadonlyArray<z.core.$ZodCheck>): CheckSet => {
  const defMap = new Map<string, z.core.$ZodCheckDef>();
  for (const c of checks) {
    const def = c._zod.def;
    if (!defMap.has(def.check)) {
      defMap.set(def.check, def);
    }
  }
  const allDefs = checks.map((c) => c._zod.def);

  return {
    has: (name) => defMap.has(name),
    find: ((name: string) => defMap.get(name)) as CheckSet['find'],
    all: () => allDefs,
  };
};

const getCheckSet = (schema: z.ZodType): CheckSet => {
  const cached = checkSetCache.get(schema);
  if (cached) return cached;
  const checkSet = createCheckSet(extractChecks(schema));
  checkSetCache.set(schema, checkSet);
  return checkSet;
};

export const createContext = <T>(
  schema: z.ZodType<T>,
  config: GeneratorConfig,
  path: ReadonlyArray<string>,
  depth: number,
  faker: Faker,
  generate: <U>(schema: z.ZodType<U>, key?: string) => U,
): GenContext<T> => ({
  schema,
  path,
  depth,
  faker,
  config,
  checks: getCheckSet(schema),
  generate,
});
