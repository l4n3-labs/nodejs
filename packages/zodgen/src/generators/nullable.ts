import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateNullable = <T>(ctx: GenContext<T | null>): unknown => {
  const { innerType } = schemaDef<z.core.$ZodNullableDef>(ctx.schema);
  return ctx.faker.number.float() < 0.8 ? ctx.generate(innerType as z.ZodType<T>) : null;
};

export const generateOptional = <T>(ctx: GenContext<T | undefined>): unknown => {
  const { innerType } = schemaDef<z.core.$ZodOptionalDef>(ctx.schema);
  return ctx.faker.number.float() < 0.8 ? ctx.generate(innerType as z.ZodType<T>) : undefined;
};

export const generateDefault = <T>(ctx: GenContext<T>): unknown =>
  ctx.generate(schemaDef<z.core.$ZodDefaultDef>(ctx.schema).innerType as z.ZodType<T>);

export const generateReadonly = <T>(ctx: GenContext<T>): unknown =>
  Object.freeze(ctx.generate(schemaDef<z.core.$ZodReadonlyDef>(ctx.schema).innerType as z.ZodType<T>));

export const generateCatch = <T>(ctx: GenContext<T>): unknown =>
  ctx.generate(schemaDef<z.core.$ZodCatchDef>(ctx.schema).innerType as z.ZodType<T>);
