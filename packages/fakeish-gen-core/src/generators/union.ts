import type { GenContext, UnionNode } from '../schema.js';

export const generateUnion = (ctx: GenContext<UnionNode>): unknown => {
  const picked = ctx.faker.helpers.arrayElement([...ctx.node.options]);
  return ctx.generate(picked);
};
