import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import type { CheckSet, GenContext, GeneratorConfig, ZodCheckInternal } from './types.js';

export const createCheckSet = (checks: ReadonlyArray<ZodCheckInternal>): CheckSet => ({
  has: (name) => checks.some((c) => c._zod.def.check === name),
  find: (name) => {
    const found = checks.find((c) => c._zod.def.check === name);
    return found ? found._zod.def : undefined;
  },
  all: () => checks.map((c) => c._zod.def),
});

const extractChecks = <S extends z.ZodType>(schema: S): ReadonlyArray<ZodCheckInternal> =>
  (schema.def.checks ?? []).map((c): ZodCheckInternal => ({ _zod: { def: { ...c._zod.def } } }));

export const createContext = <S extends z.ZodType>(
  schema: S,
  config: GeneratorConfig,
  path: ReadonlyArray<string>,
  depth: number,
  faker: Faker,
  generate: <T>(schema: z.ZodType<T>, key?: string) => T,
): GenContext => ({
  schema,
  path,
  depth,
  faker,
  config,
  checks: createCheckSet(extractChecks(schema)),
  generate,
});
