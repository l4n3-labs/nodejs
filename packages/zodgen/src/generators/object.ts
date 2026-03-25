import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateObject = <T>(ctx: GenContext<T>): Record<string, unknown> => {
  const { shape } = schemaDef<z.core.$ZodObjectDef>(ctx.schema);
  return Object.fromEntries(
    Object.entries(shape as Record<string, z.ZodType<T>>).map(([key, schema]) => [key, ctx.generate(schema, key)]),
  );
};
