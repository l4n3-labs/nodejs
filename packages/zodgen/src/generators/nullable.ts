import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateNullable = (ctx: GenContext): unknown => {
  const { innerType } = schemaDef<z.core.$ZodNullableDef>(ctx.schema);
  return ctx.faker.number.float() < 0.8 ? ctx.generate(innerType as z.ZodType) : null;
};

export const generateOptional = (ctx: GenContext): unknown => {
  const { innerType } = schemaDef<z.core.$ZodOptionalDef>(ctx.schema);
  return ctx.faker.number.float() < 0.8 ? ctx.generate(innerType as z.ZodType) : undefined;
};

export const generateDefault = (ctx: GenContext): unknown =>
  ctx.generate(schemaDef<z.core.$ZodDefaultDef>(ctx.schema).innerType as z.ZodType);

export const generateReadonly = (ctx: GenContext): unknown =>
  Object.freeze(ctx.generate(schemaDef<z.core.$ZodReadonlyDef>(ctx.schema).innerType as z.ZodType));

export const generateCatch = (ctx: GenContext): unknown =>
  ctx.generate(schemaDef<z.core.$ZodCatchDef>(ctx.schema).innerType as z.ZodType);
