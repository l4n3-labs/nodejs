import type { GenContext, TemplateLiteralNode } from '../schema.js';

export const generateTemplateLiteral = (ctx: GenContext<TemplateLiteralNode>): string =>
  ctx.node.parts
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      return String(ctx.generate(part));
    })
    .join('');
