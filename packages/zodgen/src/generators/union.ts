import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateUnion = <T>(ctx: GenContext<T, 'union'>): unknown => {
  const picked = ctx.faker.helpers.arrayElement([...ctx.def.options]);
  return ctx.generate(picked as z.ZodType);
};
