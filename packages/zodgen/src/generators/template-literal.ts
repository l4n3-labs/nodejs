import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateTemplateLiteral = <T = string>(ctx: GenContext<T>): string => {
  const { parts } = schemaDef<z.core.$ZodTemplateLiteralDef>(ctx.schema);

  return parts
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      // Part is a schema — generate a value and coerce to string
      return String(ctx.generate(part as z.ZodType<T>));
    })
    .join('');
};
