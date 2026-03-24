import type { GenContext, ZodCheckDef } from '../types.js';

const DEFAULT_MIN = -1_000_000;
const DEFAULT_MAX = 1_000_000;

const resolveBigIntMin = (gtCheck: ZodCheckDef | undefined): number => {
  if (!gtCheck) return DEFAULT_MIN;
  const val = Number(gtCheck.value as bigint);
  const inclusive = gtCheck.inclusive as boolean;
  return inclusive ? val : val + 1;
};

const resolveBigIntMax = (ltCheck: ZodCheckDef | undefined): number => {
  if (!ltCheck) return DEFAULT_MAX;
  const val = Number(ltCheck.value as bigint);
  const inclusive = ltCheck.inclusive as boolean;
  return inclusive ? val : val - 1;
};

export const generateBigInt = (ctx: GenContext): bigint => {
  const { faker, checks } = ctx;

  const min = resolveBigIntMin(checks.find('greater_than'));
  const max = resolveBigIntMax(checks.find('less_than'));

  return BigInt(faker.number.int({ min: Math.ceil(min), max: Math.floor(max) }));
};
