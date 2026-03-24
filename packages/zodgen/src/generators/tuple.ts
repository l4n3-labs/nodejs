import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateTuple = (ctx: GenContext): unknown[] => {
  const def = (ctx.schema as any)._zod.def as { items: z.ZodType[]; rest: z.ZodType | null };
  const items = def.items.map((schema) => ctx.generate(schema));

  if (def.rest === null) {
    return items;
  }

  const restCount = ctx.faker.number.int({ min: 0, max: 2 });
  const restItems = Array.from({ length: restCount }, () => ctx.generate(def.rest as z.ZodType));
  return [...items, ...restItems];
};
