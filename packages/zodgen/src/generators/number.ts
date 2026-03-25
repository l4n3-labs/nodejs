import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

const DEFAULT_MIN = -1_000_000;
const DEFAULT_MAX = 1_000_000;

const resolveMin = (gtCheck: z.core.$ZodCheckGreaterThanDef | undefined, isInt: boolean): number => {
  if (!gtCheck) return DEFAULT_MIN;
  const val = Number(gtCheck.value);
  const inclusive = gtCheck.inclusive;
  return inclusive ? val : val + (isInt ? 1 : Number.EPSILON);
};

const resolveMax = (ltCheck: z.core.$ZodCheckLessThanDef | undefined, isInt: boolean): number => {
  if (!ltCheck) return DEFAULT_MAX;
  const val = Number(ltCheck.value);
  const inclusive = ltCheck.inclusive;
  return inclusive ? val : val - (isInt ? 1 : Number.EPSILON);
};

export const generateNumber = <T = number>(ctx: GenContext<T>): number => {
  const { faker, checks } = ctx;

  const gtCheck = checks.find('greater_than');
  const ltCheck = checks.find('less_than');
  const formatCheck = checks.find('number_format');
  const multipleOfCheck = checks.find('multiple_of');

  const fmt = formatCheck ? formatCheck.format : undefined;
  const isInt = fmt === 'safeint' || fmt === 'int32' || fmt === 'uint32';
  const min = resolveMin(gtCheck, isInt);
  const max = resolveMax(ltCheck, isInt);

  if (multipleOfCheck) {
    const step = Number(multipleOfCheck.value);
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
