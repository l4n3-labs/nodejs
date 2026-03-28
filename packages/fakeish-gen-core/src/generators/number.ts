import type { GenContext, NumberNode } from '../schema.js';

const DEFAULT_MIN = -1_000_000;
const DEFAULT_MAX = 1_000_000;

const resolveMin = (constraints: NumberNode['constraints']): number => {
  if (constraints.minimum === undefined) return DEFAULT_MIN;
  return constraints.exclusiveMinimum
    ? constraints.minimum + (constraints.integer ? 1 : Number.EPSILON)
    : constraints.minimum;
};

const resolveMax = (constraints: NumberNode['constraints']): number => {
  if (constraints.maximum === undefined) return DEFAULT_MAX;
  return constraints.exclusiveMaximum
    ? constraints.maximum - (constraints.integer ? 1 : Number.EPSILON)
    : constraints.maximum;
};

export const generateNumber = (ctx: GenContext<NumberNode>): number => {
  const { faker } = ctx;
  const { constraints } = ctx.node;

  const isInt = constraints.integer === true;
  const min = resolveMin(constraints);
  const max = resolveMax(constraints);

  if (constraints.multipleOf !== undefined) {
    const step = constraints.multipleOf;
    const rawMin = Math.ceil(min / step) * step;
    const rawMax = Math.floor(max / step) * step;
    const count = Math.floor((rawMax - rawMin) / step) + 1;
    const index = faker.number.int({ min: 0, max: Math.max(0, count - 1) });
    const result = rawMin + index * step;
    return result === 0 ? 0 : result; // Avoid -0
  }

  if (isInt) {
    return faker.number.int({ min: Math.ceil(min), max: Math.floor(max) });
  }

  return faker.number.float({ min, max });
};
