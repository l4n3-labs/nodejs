import type { GenContext, ZodCheckDef } from '../types.js';

const DEFAULT_MIN = -1_000_000;
const DEFAULT_MAX = 1_000_000;

const resolveMin = (gtCheck: ZodCheckDef | undefined, isInt: boolean): number => {
  if (!gtCheck) return DEFAULT_MIN;
  const val = gtCheck.value as number;
  const inclusive = gtCheck.inclusive as boolean;
  return inclusive ? val : val + (isInt ? 1 : Number.EPSILON);
};

const resolveMax = (ltCheck: ZodCheckDef | undefined, isInt: boolean): number => {
  if (!ltCheck) return DEFAULT_MAX;
  const val = ltCheck.value as number;
  const inclusive = ltCheck.inclusive as boolean;
  return inclusive ? val : val - (isInt ? 1 : Number.EPSILON);
};

export const generateNumber = (ctx: GenContext): number => {
  const { faker, checks } = ctx;

  const gtCheck = checks.find('greater_than');
  const ltCheck = checks.find('less_than');
  const formatCheck = checks.find('number_format');
  const multipleOfCheck = checks.find('multiple_of');

  const fmt = formatCheck ? (formatCheck.format as string) : undefined;
  const isInt = fmt === 'int' || fmt === 'safeint';
  const min = resolveMin(gtCheck, isInt);
  const max = resolveMax(ltCheck, isInt);

  if (multipleOfCheck) {
    const step = multipleOfCheck.value as number;
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
