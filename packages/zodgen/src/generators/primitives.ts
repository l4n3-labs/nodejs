import type { GenContext } from '../types.js';

export const generateNull = (_ctx: GenContext): null => null;

export const generateUndefined = (_ctx: GenContext): undefined => undefined;

export const generateVoid = (_ctx: GenContext): undefined => undefined;

export const generateNaN = (_ctx: GenContext): number => Number.NaN;

export const generateNever = (_ctx: GenContext): never => {
  throw new Error('Cannot generate a value for z.never()');
};

export const generateUnknown = (_ctx: GenContext): null => null;

export const generateAny = (_ctx: GenContext): null => null;

export const generateSymbol = (_ctx: GenContext): symbol => Symbol();

export const generateCustom = (_ctx: GenContext): never => {
  throw new Error('Cannot generate a value for custom schemas — use override() to provide a generator');
};
