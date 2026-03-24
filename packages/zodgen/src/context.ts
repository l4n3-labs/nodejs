import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import type { CheckSet, GenContext, GeneratorConfig } from './types.js';

export const createCheckSet = (checks: ReadonlyArray<z.core.$ZodCheck>): CheckSet => ({
  has: (name) => checks.some((c) => c._zod.def.check === name),
  find: ((name: string) => {
    const found = checks.find((c) => c._zod.def.check === name);
    return found ? found._zod.def : undefined;
  }) as CheckSet['find'],
  all: () => checks.map((c) => c._zod.def),
});

const extractChecks = <S extends z.ZodType>(schema: S): ReadonlyArray<z.core.$ZodCheck> =>
  (schema.def.checks ?? []) as ReadonlyArray<z.core.$ZodCheck>;

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
