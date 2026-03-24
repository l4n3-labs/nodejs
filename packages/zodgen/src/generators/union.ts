import type { GenContext } from '../types.js';

export const generateUnion = (ctx: GenContext): unknown => {
  const options = (ctx.schema as any)._zod.def.options as ReadonlyArray<unknown>;
  const picked = ctx.faker.helpers.arrayElement([...options]);
  return ctx.generate(picked as any);
};
