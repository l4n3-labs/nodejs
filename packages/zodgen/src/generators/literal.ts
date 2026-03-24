import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateLiteral = (ctx: GenContext): unknown => {
  const { values } = schemaDef<z.core.$ZodLiteralDef<z.core.util.Literal>>(ctx.schema);

  if (values.length === 1) {
    return values[0];
  }

  return ctx.faker.helpers.arrayElement(values);
};
