import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateSet = (ctx: GenContext): Set<unknown> => {
  const { valueType } = schemaDef<z.core.$ZodSetDef>(ctx.schema);
  const { checks, faker } = ctx;

  const minCheck = checks.find('min_size') ?? checks.find('min_length');
  const maxCheck = checks.find('max_size') ?? checks.find('max_length');
  const lengthCheck = checks.find('size_equals') ?? checks.find('length_equals');

  const min = minCheck ? minCheck.minimum : 1;
  const max = maxCheck ? maxCheck.maximum : Math.max(3, min);
  const count = lengthCheck
    ? 'size' in lengthCheck
      ? lengthCheck.size
      : lengthCheck.length
    : faker.number.int({ min, max });

  const values: unknown[] = [];
  let retries = 0;
  const maxRetries = 100;

  while (values.length < count) {
    if (retries >= maxRetries) {
      throw new Error(`generateSet: could not generate ${count} unique values after ${maxRetries} retries`);
    }
    const value = ctx.generate(valueType as z.ZodType);
    if (!values.includes(value)) {
      values.push(value);
    } else {
      retries++;
    }
  }

  return new Set(values);
};
