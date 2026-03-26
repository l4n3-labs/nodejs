import type { GenContext, IntersectionNode } from '../schema.js';

export const generateIntersection = (ctx: GenContext<IntersectionNode>): unknown => {
  const left = ctx.generate(ctx.node.left) as Record<string, unknown>;
  const right = ctx.generate(ctx.node.right) as Record<string, unknown>;
  return { ...left, ...right };
};
