import type { GenContext } from '../types.js';

export const generateNull = <T = null>(_ctx: GenContext<T>): null => null;

export const generateUndefined = <T = undefined>(_ctx: GenContext<T>): undefined => undefined;

export const generateVoid = <T = undefined>(_ctx: GenContext<T>): undefined => undefined;

export const generateNaN = <T = number>(_ctx: GenContext<T>): number => Number.NaN;

export const generateNever = <T = never>(_ctx: GenContext<T>): never => {
  throw new Error('Cannot generate a value for z.never()');
};

export const generateUnknown = <T = null>(_ctx: GenContext<T>): null => null;

export const generateAny = <T = null>(_ctx: GenContext<T>): null => null;

export const generateSymbol = <T = symbol>(_ctx: GenContext<T>): symbol => Symbol();

export const generateCustom = <T = never>(_ctx: GenContext<T>): never => {
  throw new Error('Cannot generate a value for custom schemas — use override() to provide a generator');
};
