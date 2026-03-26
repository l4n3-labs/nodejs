import type { EnumNode, GenContext } from '../schema.js';

export const generateEnum = (ctx: GenContext<EnumNode>): string | number =>
  ctx.faker.helpers.arrayElement([...ctx.node.values]);
