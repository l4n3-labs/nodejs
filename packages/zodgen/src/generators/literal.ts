import type { GenContext } from '../types.js';

export const generateLiteral = <T>(ctx: GenContext<T, 'literal'>): unknown => {
  const { values } = ctx.def;

  if (values.length === 1) {
    return values[0];
  }

  return ctx.faker.helpers.arrayElement(values);
};
