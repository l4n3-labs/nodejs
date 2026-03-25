import type { GenContext } from '../types.js';

export const generateBoolean = <T = boolean>(ctx: GenContext<T>): boolean => ctx.faker.datatype.boolean();
