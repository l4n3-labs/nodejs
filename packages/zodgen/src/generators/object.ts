import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateObject = (ctx: GenContext): Record<string, unknown> => {
  const shape = (ctx.schema as any)._zod.def.shape as Record<string, z.ZodType>;
  return Object.fromEntries(Object.entries(shape).map(([key, schema]) => [key, ctx.generate(schema, key)]));
};
