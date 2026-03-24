import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateMap = (ctx: GenContext): Map<unknown, unknown> => {
  const def = (ctx.schema as any)._zod.def as { keyType: z.ZodType; valueType: z.ZodType };
  const { checks, faker } = ctx;

  const minCheck = checks.find('min_length');
  const maxCheck = checks.find('max_length');

  const count = faker.number.int({
    min: minCheck ? (minCheck.minimum as number) : 1,
    max: maxCheck ? (maxCheck.maximum as number) : 3,
  });

  const entries = Array.from(
    { length: count },
    () => [ctx.generate(def.keyType), ctx.generate(def.valueType)] as [unknown, unknown],
  );

  return new Map(entries);
};
