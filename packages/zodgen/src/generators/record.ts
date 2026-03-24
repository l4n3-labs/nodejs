import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateRecord = (ctx: GenContext): Record<string, unknown> => {
  const def = (ctx.schema as any)._zod.def as { keyType: z.ZodType; valueType: z.ZodType };
  const { faker } = ctx;

  const count = faker.number.int({ min: 1, max: 3 });

  const entries = Array.from(
    { length: count },
    () => [String(ctx.generate(def.keyType)), ctx.generate(def.valueType)] as [string, unknown],
  );

  return Object.fromEntries(entries);
};
