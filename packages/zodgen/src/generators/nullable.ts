import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateNullable = <T>(ctx: GenContext<T | null, 'nullable'>): unknown => {
  const { innerType } = ctx.def;
  return ctx.faker.number.float() < 0.8 ? ctx.generate(innerType as z.ZodType) : null;
};

export const generateOptional = <T>(ctx: GenContext<T | undefined, 'optional'>): unknown => {
  const { innerType } = ctx.def;
  return ctx.faker.number.float() < 0.8 ? ctx.generate(innerType as z.ZodType) : undefined;
};

export const generateDefault = <T>(ctx: GenContext<T, 'default'>): unknown => ctx.def.defaultValue;

export const generateReadonly = <T>(ctx: GenContext<T, 'readonly'>): unknown =>
  Object.freeze(ctx.generate(ctx.def.innerType as z.ZodType));

export const generateCatch = <T>(ctx: GenContext<T, 'catch'>): unknown => ctx.generate(ctx.def.innerType as z.ZodType);
