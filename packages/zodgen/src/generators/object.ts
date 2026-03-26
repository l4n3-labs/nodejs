import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateObject = <T>(ctx: GenContext<T, 'object'>): Record<string, unknown> => {
  const obj = Object.fromEntries(
    Object.entries(ctx.def.shape as Record<string, z.ZodType>).map(([key, schema]) => [key, ctx.generate(schema, key)]),
  );

  if (ctx.config.derivations.length > 0) {
    for (const derivation of ctx.config.derivations) {
      if (derivation.key in obj) {
        obj[derivation.key] = derivation.compute(obj);
      }
    }
  }

  return obj;
};
