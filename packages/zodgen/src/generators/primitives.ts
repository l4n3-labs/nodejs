import type { GenContext } from '../types.js';

export const generateNull = <T = null>(_ctx: GenContext<T, 'null'>): null => null;

export const generateUndefined = <T = undefined>(_ctx: GenContext<T, 'undefined'>): undefined => undefined;

export const generateVoid = <T = undefined>(_ctx: GenContext<T, 'void'>): undefined => undefined;

export const generateNaN = <T = number>(_ctx: GenContext<T, 'nan'>): number => Number.NaN;

export const generateNever = <T = never>(_ctx: GenContext<T, 'never'>): never => {
  throw new Error('Cannot generate a value for z.never()');
};

export const generateUnknown = <T = null>(_ctx: GenContext<T, 'unknown'>): null => null;

export const generateAny = <T = null>(_ctx: GenContext<T, 'any'>): null => null;

export const generateSymbol = <T = symbol>(_ctx: GenContext<T, 'symbol'>): symbol => Symbol();

export const generateCustom = <T = never>(_ctx: GenContext<T, 'custom'>): never => {
  throw new Error('Cannot generate a value for custom schemas — use override() to provide a generator');
};
