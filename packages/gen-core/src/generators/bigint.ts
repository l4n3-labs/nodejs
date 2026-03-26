import type { BigIntNode, GenContext } from '../schema.js';

const DEFAULT_MIN = -1_000_000;
const DEFAULT_MAX = 1_000_000;

export const generateBigInt = (ctx: GenContext<BigIntNode>): bigint => {
  const { faker } = ctx;
  const { constraints } = ctx.node;

  const rawMin = constraints.minimum ?? DEFAULT_MIN;
  const rawMax = constraints.maximum ?? DEFAULT_MAX;

  const min = constraints.exclusiveMinimum ? rawMin + 1 : rawMin;
  const max = constraints.exclusiveMaximum ? rawMax - 1 : rawMax;

  return BigInt(faker.number.int({ min: Math.ceil(min), max: Math.floor(max) }));
};
