import type { GenContext } from '../types.js';

export const generateBoolean = (ctx: GenContext): boolean => ctx.faker.datatype.boolean();
