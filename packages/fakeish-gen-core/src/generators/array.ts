import type { ArrayNode, GenContext } from '../schema.js';

export const generateArray = (ctx: GenContext<ArrayNode>): unknown[] => {
  const { faker } = ctx;
  const { constraints, element } = ctx.node;
  const atDepthLimit = ctx.depth >= ctx.config.maxDepth;

  const min = atDepthLimit ? 0 : (constraints.minSize ?? 1);
  const max = atDepthLimit ? 0 : (constraints.maxSize ?? Math.max(3, min));
  const count = atDepthLimit ? 0 : (constraints.exactSize ?? faker.number.int({ min, max }));

  return Array.from({ length: count }, () => ctx.generate(element));
};
