import type { GenContext } from '../types.js';

export const generateBoolean = <T = boolean>(ctx: GenContext<T, 'boolean'>): boolean => ctx.faker.datatype.boolean();
