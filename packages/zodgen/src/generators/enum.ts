import type { GenContext } from '../types.js';

export const generateEnum = (ctx: GenContext): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (ctx.schema as any)._zod.def as { entries: Record<string, string> };
  const values = Object.values(def.entries);
  return ctx.faker.helpers.arrayElement(values);
};
