import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateSet = <T>(ctx: GenContext<T, 'set'>): Set<unknown> => {
  const { checks, faker } = ctx;
  const atDepthLimit = ctx.depth >= ctx.config.maxDepth;

  const minCheck = checks.find('min_size') ?? checks.find('min_length');
  const maxCheck = checks.find('max_size') ?? checks.find('max_length');
  const lengthCheck = checks.find('size_equals') ?? checks.find('length_equals');

  const min = atDepthLimit ? 0 : minCheck ? minCheck.minimum : 1;
  const max = atDepthLimit ? 0 : maxCheck ? maxCheck.maximum : Math.max(3, min);
  const count = atDepthLimit
    ? 0
    : lengthCheck
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
    const value = ctx.generate(ctx.def.valueType as z.ZodType);
    if (!values.includes(value)) {
      values.push(value);
    } else {
      retries++;
    }
  }

  return new Set(values);
};
