import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateLazy = (ctx: GenContext): unknown => {
  if (ctx.depth >= 3) return undefined;
  const { getter } = schemaDef<z.core.$ZodLazyDef>(ctx.schema);
  const innerSchema = getter();
  return ctx.generate(innerSchema as z.ZodType);
};

export const generatePromise = (ctx: GenContext): Promise<unknown> =>
  Promise.resolve(ctx.generate(schemaDef<z.core.$ZodPromiseDef>(ctx.schema).innerType as z.ZodType));

export const generatePipe = (ctx: GenContext): unknown =>
  ctx.generate(schemaDef<z.core.$ZodPipeDef>(ctx.schema).in as z.ZodType);
