import type { GenContext } from '../types.js';

export const generateNullable = (ctx: GenContext): unknown => {
  const innerType = (ctx.schema as any)._zod.def.innerType;
  return ctx.faker.number.float() < 0.8 ? ctx.generate(innerType) : null;
};

export const generateOptional = (ctx: GenContext): unknown => {
  const innerType = (ctx.schema as any)._zod.def.innerType;
  return ctx.faker.number.float() < 0.8 ? ctx.generate(innerType) : undefined;
};

export const generateDefault = (ctx: GenContext): unknown => ctx.generate((ctx.schema as any)._zod.def.innerType);

export const generateReadonly = (ctx: GenContext): unknown =>
  Object.freeze(ctx.generate((ctx.schema as any)._zod.def.innerType));

export const generateCatch = (ctx: GenContext): unknown => ctx.generate((ctx.schema as any)._zod.def.innerType);
