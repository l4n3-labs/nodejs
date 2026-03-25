import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateRecord = <T>(ctx: GenContext<T, 'record'>): T => {
  const { def, faker } = ctx;

  const count = faker.number.int({ min: 1, max: 3 });

  const entries = Array.from({ length: count }, () => [
    String(ctx.generate(def.keyType as z.ZodType)),
    ctx.generate(def.valueType as z.ZodType),
  ]);

  return Object.fromEntries(entries) as T;
};
