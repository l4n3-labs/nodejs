import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateUnion = (ctx: GenContext): unknown => {
  const { options } = schemaDef<z.core.$ZodUnionDef>(ctx.schema);
  const picked = ctx.faker.helpers.arrayElement([...options]);
  return ctx.generate(picked as z.ZodType);
};
