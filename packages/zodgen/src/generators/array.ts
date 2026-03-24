import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateArray = (ctx: GenContext): unknown[] => {
  const element = (ctx.schema as any)._zod.def.element as z.ZodType;
  const { checks, faker } = ctx;

  const minCheck = checks.find('min_length');
  const maxCheck = checks.find('max_length');
  const lengthCheck = checks.find('length_equals');

  const min = minCheck ? (minCheck.minimum as number) : 1;
  const max = maxCheck ? (maxCheck.maximum as number) : Math.max(3, min);
  const count = lengthCheck ? (lengthCheck.length as number) : faker.number.int({ min, max });

  return Array.from({ length: count }, () => ctx.generate(element));
};
