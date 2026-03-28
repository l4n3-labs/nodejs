import type { DateNode, GenContext } from '../schema.js';

const DEFAULT_FROM = new Date('2000-01-01T00:00:00.000Z');
const DEFAULT_TO = new Date('2030-12-31T23:59:59.999Z');

export const generateDate = (ctx: GenContext<DateNode>): Date => {
  const { faker } = ctx;
  const { constraints } = ctx.node;

  const fromVal = constraints.minimum;
  const toVal = constraints.maximum;

  const from = fromVal !== undefined ? new Date(fromVal) : DEFAULT_FROM;
  const to = toVal !== undefined ? new Date(toVal) : DEFAULT_TO;

  return faker.date.between({ from, to });
};
