import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import type { CheckSet, GenContext, GeneratorConfig, ZodCheckInternal } from './types.js';

export const createCheckSet = (checks: ReadonlyArray<unknown>): CheckSet => ({
  has: (name) => checks.some((c) => (c as ZodCheckInternal)._zod.def.check === name),
  find: (name) => {
    const found = checks.find((c) => (c as ZodCheckInternal)._zod.def.check === name);
    return found ? (found as ZodCheckInternal)._zod.def : undefined;
  },
  all: () => checks.map((c) => (c as ZodCheckInternal)._zod.def),
});

export const createContext = (
  schema: z.ZodType,
  config: GeneratorConfig,
  path: ReadonlyArray<string>,
  depth: number,
  faker: Faker,
  generate: (schema: z.ZodType, key?: string) => unknown,
): GenContext => ({
  schema,
  path,
  depth,
  faker,
  config,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checks: createCheckSet(((schema as any)._zod.def.checks as ReadonlyArray<unknown>) ?? []),
  generate,
});
