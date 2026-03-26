import type {
  AnyNode,
  CustomNode,
  GenContext,
  NaNNode,
  NeverNode,
  NullNode,
  SymbolNode,
  UndefinedNode,
  UnknownNode,
  VoidNode,
} from '../schema.js';

export const generateNull = (_ctx: GenContext<NullNode>): null => null;

export const generateUndefined = (_ctx: GenContext<UndefinedNode>): undefined => undefined;

export const generateVoid = (_ctx: GenContext<VoidNode>): undefined => undefined;

export const generateNaN = (_ctx: GenContext<NaNNode>): number => Number.NaN;

export const generateNever = (_ctx: GenContext<NeverNode>): never => {
  throw new Error('Cannot generate a value for never type');
};

export const generateUnknown = (_ctx: GenContext<UnknownNode>): null => null;

export const generateAny = (_ctx: GenContext<AnyNode>): null => null;

export const generateSymbol = (_ctx: GenContext<SymbolNode>): symbol => Symbol();

export const generateCustom = (_ctx: GenContext<CustomNode>): never => {
  throw new Error('Cannot generate a value for custom schemas — use override() to provide a generator');
};
