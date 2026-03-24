import type { GenContext } from '../types.js';

export const generateIntersection = (ctx: GenContext): unknown => {
  const def = (ctx.schema as any)._zod.def;
  const left = ctx.generate(def.left) as Record<string, unknown>;
  const right = ctx.generate(def.right) as Record<string, unknown>;
  return { ...left, ...right };
};
