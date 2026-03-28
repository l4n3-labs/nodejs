import type { GenContext, RecordNode } from '../schema.js';

export const generateRecord = (ctx: GenContext<RecordNode>): Record<string, unknown> => {
  const { faker } = ctx;
  const { key, value } = ctx.node;

  const count = faker.number.int({ min: 1, max: 3 });

  const entries = Array.from({ length: count }, () => [String(ctx.generate(key)), ctx.generate(value)]);

  return Object.fromEntries(entries);
};
