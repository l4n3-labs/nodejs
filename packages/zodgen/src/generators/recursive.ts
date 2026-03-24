import type { GenContext } from '../types.js';

export const generateLazy = (ctx: GenContext): unknown => {
  if (ctx.depth >= 3) return undefined;
  const getter = (ctx.schema as any)._zod.def.getter as () => unknown;
  const innerSchema = getter();
  return ctx.generate(innerSchema as any);
};

export const generatePromise = (ctx: GenContext): Promise<unknown> =>
  Promise.resolve(ctx.generate((ctx.schema as any)._zod.def.innerType));

export const generatePipe = (ctx: GenContext): unknown => ctx.generate((ctx.schema as any)._zod.def.in);
