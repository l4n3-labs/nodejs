import type { GenContext } from '../types.js';

const DEFAULT_FROM = new Date('2000-01-01T00:00:00.000Z');
const DEFAULT_TO = new Date('2030-12-31T23:59:59.999Z');

export const generateDate = (ctx: GenContext): Date => {
  const { faker, checks } = ctx;

  const gtCheck = checks.find('greater_than');
  const ltCheck = checks.find('less_than');

  const from = gtCheck ? (gtCheck.value as Date) : DEFAULT_FROM;
  const to = ltCheck ? (ltCheck.value as Date) : DEFAULT_TO;

  return faker.date.between({ from, to });
};
