import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateLazy = <T>(ctx: GenContext<T, 'lazy'>): unknown => {
  if (ctx.depth >= 3) return undefined;
  const innerSchema = ctx.def.getter();
  return ctx.generate(innerSchema as z.ZodType);
};

export const generatePromise = <T>(ctx: GenContext<T, 'promise'>): Promise<unknown> =>
  Promise.resolve(ctx.generate(ctx.def.innerType as z.ZodType));

export const generatePipe = <T>(ctx: GenContext<T, 'pipe'>): unknown => ctx.generate(ctx.def.in as z.ZodType);
