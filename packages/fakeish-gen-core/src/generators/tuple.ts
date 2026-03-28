import type { GenContext, TupleNode } from '../schema.js';

export const generateTuple = (ctx: GenContext<TupleNode>): unknown[] => {
  const { items, rest } = ctx.node;
  const generated = items.map((node) => ctx.generate(node));

  if (rest === null) {
    return generated;
  }

  const restCount = ctx.faker.number.int({ min: 0, max: 2 });
  const restItems = Array.from({ length: restCount }, () => ctx.generate(rest));
  return [...generated, ...restItems];
};
