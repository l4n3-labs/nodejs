import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateTuple = <T>(ctx: GenContext<T>): unknown[] => {
  const def = schemaDef<z.core.$ZodTupleDef>(ctx.schema);
  const items = def.items.map((schema) => ctx.generate(schema as z.ZodType<T>));

  if (def.rest === null) {
    return items;
  }

  const restCount = ctx.faker.number.int({ min: 0, max: 2 });
  const restItems = Array.from({ length: restCount }, () => ctx.generate(def.rest as z.ZodType<T>));
  return [...items, ...restItems];
};
