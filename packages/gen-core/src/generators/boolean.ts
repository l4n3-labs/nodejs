import type { BooleanNode, GenContext } from '../schema.js';

export const generateBoolean = (ctx: GenContext<BooleanNode>): boolean => ctx.faker.datatype.boolean();
