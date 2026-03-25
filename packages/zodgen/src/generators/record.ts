import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateRecord = <T>(ctx: GenContext<T>): Record<string, unknown> => {
  const def = schemaDef<z.core.$ZodRecordDef>(ctx.schema);
  const { faker } = ctx;

  const count = faker.number.int({ min: 1, max: 3 });

  const entries = Array.from(
    { length: count },
    () =>
      [String(ctx.generate(def.keyType as z.ZodType<T>)), ctx.generate(def.valueType as z.ZodType<T>)] as [
        string,
        unknown,
      ],
  );

  return Object.fromEntries(entries);
};
