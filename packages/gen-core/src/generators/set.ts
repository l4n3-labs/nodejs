import type { GenContext, SetNode } from '../schema.js';

export const generateSet = (ctx: GenContext<SetNode>): Set<unknown> => {
  const { faker } = ctx;
  const { constraints, element } = ctx.node;
  const atDepthLimit = ctx.depth >= ctx.config.maxDepth;

  const min = atDepthLimit ? 0 : (constraints.minSize ?? 1);
  const max = atDepthLimit ? 0 : (constraints.maxSize ?? Math.max(3, min));
  const count = atDepthLimit ? 0 : (constraints.exactSize ?? faker.number.int({ min, max }));

  const values: unknown[] = [];
  const maxRetries = 100;

  for (let retries = 0; values.length < count; retries++) {
    if (retries >= maxRetries) {
      throw new Error(`generateSet: could not generate ${count} unique values after ${maxRetries} retries`);
    }
    const value = ctx.generate(element);
    if (!values.includes(value)) {
      values.push(value);
    }
  }

  return new Set(values);
};
