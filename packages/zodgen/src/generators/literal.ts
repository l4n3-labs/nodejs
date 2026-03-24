import type { GenContext } from '../types.js';

export const generateLiteral = (ctx: GenContext): unknown => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (ctx.schema as any)._zod.def as { values: unknown[] };
  const { values } = def;

  if (values.length === 1) {
    return values[0];
  }

  return ctx.faker.helpers.arrayElement(values);
};
