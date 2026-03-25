import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

const DEFAULT_MIN = -1_000_000;
const DEFAULT_MAX = 1_000_000;

const resolveBigIntMin = (gtCheck: z.core.$ZodCheckGreaterThanDef | undefined): number => {
  if (!gtCheck) return DEFAULT_MIN;
  const val = Number(gtCheck.value);
  const inclusive = gtCheck.inclusive;
  return inclusive ? val : val + 1;
};

const resolveBigIntMax = (ltCheck: z.core.$ZodCheckLessThanDef | undefined): number => {
  if (!ltCheck) return DEFAULT_MAX;
  const val = Number(ltCheck.value);
  const inclusive = ltCheck.inclusive;
  return inclusive ? val : val - 1;
};

export const generateBigInt = <T = bigint>(ctx: GenContext<T, 'bigint'>): bigint => {
  const { faker, checks } = ctx;

  const min = resolveBigIntMin(checks.find('greater_than'));
  const max = resolveBigIntMax(checks.find('less_than'));

  return BigInt(faker.number.int({ min: Math.ceil(min), max: Math.floor(max) }));
};
