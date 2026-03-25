import type { GenContext } from '../types.js';

export const generateEnum = <T = string>(ctx: GenContext<T, 'enum'>): string => {
  const values = Object.values(ctx.def.entries) as string[];
  return ctx.faker.helpers.arrayElement(values);
};
