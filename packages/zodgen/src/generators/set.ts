import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateSet = (ctx: GenContext): Set<unknown> => {
  const valueType = (ctx.schema as any)._zod.def.valueType as z.ZodType;
  const { checks, faker } = ctx;

  const minCheck = checks.find('min_size') ?? checks.find('min_length');
  const maxCheck = checks.find('max_size') ?? checks.find('max_length');
  const lengthCheck = checks.find('size_equals') ?? checks.find('length_equals');

  const min = minCheck ? (minCheck.minimum as number) : 1;
  const max = maxCheck ? (maxCheck.maximum as number) : Math.max(3, min);
  const count = lengthCheck ? (lengthCheck.length as number) : faker.number.int({ min, max });

  const values: unknown[] = [];
  let retries = 0;
  const maxRetries = 100;

  while (values.length < count) {
    if (retries >= maxRetries) {
      throw new Error(`generateSet: could not generate ${count} unique values after ${maxRetries} retries`);
    }
    const value = ctx.generate(valueType);
    if (!values.includes(value)) {
      values.push(value);
    } else {
      retries++;
    }
  }

  return new Set(values);
};
