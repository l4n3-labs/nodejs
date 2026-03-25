import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';

export const generateTemplateLiteral = <T = string>(ctx: GenContext<T, 'template_literal'>): string =>
  ctx.def.parts
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      return String(ctx.generate(part as z.ZodType));
    })
    .join('');
