import type { GenContext, ObjectNode } from '../schema.js';

export const generateObject = (ctx: GenContext<ObjectNode>): Record<string, unknown> => {
  const obj = Object.fromEntries(Object.entries(ctx.node.shape).map(([key, node]) => [key, ctx.generate(node, key)]));

  if (ctx.config.derivations.length > 0) {
    for (const derivation of ctx.config.derivations) {
      if (derivation.key in obj) {
        obj[derivation.key] = derivation.compute(obj);
      }
    }
  }

  return obj;
};
