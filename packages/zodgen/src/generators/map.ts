import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateMap = <T>(ctx: GenContext<T, 'map'>): Map<unknown, unknown> => {
  const { def, checks, faker } = ctx;

  const minCheck = checks.find('min_size');
  const maxCheck = checks.find('max_size');

  const count = faker.number.int({
    min: minCheck ? minCheck.minimum : 1,
    max: maxCheck ? maxCheck.maximum : 3,
  });

  const entries = Array.from(
    { length: count },
    () => [ctx.generate(def.keyType as z.ZodType), ctx.generate(def.valueType as z.ZodType)] as [unknown, unknown],
  );

  return new Map(entries);
};
