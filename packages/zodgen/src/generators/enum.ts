import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateEnum = (ctx: GenContext): string => {
  const { entries } = schemaDef<z.core.$ZodEnumDef>(ctx.schema);
  const values = Object.values(entries) as string[];
  return ctx.faker.helpers.arrayElement(values);
};
