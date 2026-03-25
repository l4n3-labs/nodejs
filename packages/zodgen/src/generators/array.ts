import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateArray = <T>(ctx: GenContext<T, 'array'>): unknown[] => {
  const { checks, faker } = ctx;

  const minCheck = checks.find('min_length');
  const maxCheck = checks.find('max_length');
  const lengthCheck = checks.find('length_equals');

  const min = minCheck ? minCheck.minimum : 1;
  const max = maxCheck ? maxCheck.maximum : Math.max(3, min);
  const count = lengthCheck ? lengthCheck.length : faker.number.int({ min, max });

  return Array.from({ length: count }, () => ctx.generate(ctx.def.element as z.ZodType));
};
