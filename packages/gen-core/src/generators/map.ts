import type { GenContext, MapNode } from '../schema.js';

export const generateMap = (ctx: GenContext<MapNode>): Map<unknown, unknown> => {
  const { faker } = ctx;
  const { constraints, key, value } = ctx.node;
  const atDepthLimit = ctx.depth >= ctx.config.maxDepth;

  const count = atDepthLimit
    ? 0
    : faker.number.int({
        min: constraints.minSize ?? 1,
        max: constraints.maxSize ?? 3,
      });

  const entries = Array.from({ length: count }, () => [ctx.generate(key), ctx.generate(value)] as [unknown, unknown]);

  return new Map(entries);
};
