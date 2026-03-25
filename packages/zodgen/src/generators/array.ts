import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateArray = <T>(ctx: GenContext<T, 'array'>): unknown[] => {
  const { checks, faker } = ctx;
  const atDepthLimit = ctx.depth >= ctx.config.maxDepth;

  const minCheck = checks.find('min_length');
  const maxCheck = checks.find('max_length');
  const lengthCheck = checks.find('length_equals');

  const min = atDepthLimit ? 0 : minCheck ? minCheck.minimum : 1;
  const max = atDepthLimit ? 0 : maxCheck ? maxCheck.maximum : Math.max(3, min);
  const count = atDepthLimit ? 0 : lengthCheck ? lengthCheck.length : faker.number.int({ min, max });

  return Array.from({ length: count }, () => ctx.generate(ctx.def.element as z.ZodType));
};
