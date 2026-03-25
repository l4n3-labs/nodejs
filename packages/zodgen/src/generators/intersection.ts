import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateIntersection = <T>(ctx: GenContext<T, 'intersection'>): unknown => {
  const { def } = ctx;
  const left = ctx.generate(def.left as z.ZodType) as Record<string, unknown>;
  const right = ctx.generate(def.right as z.ZodType) as Record<string, unknown>;
  return { ...left, ...right };
};
