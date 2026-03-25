import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateObject = <T>(ctx: GenContext<T, 'object'>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(ctx.def.shape as Record<string, z.ZodType>).map(([key, schema]) => [key, ctx.generate(schema, key)]),
  );
