import type { GenContext, LiteralNode } from '../schema.js';

export const generateLiteral = (ctx: GenContext<LiteralNode>): unknown => {
  const { values } = ctx.node;

  if (values.length === 1) {
    return values[0];
  }

  return ctx.faker.helpers.arrayElement([...values]);
};
