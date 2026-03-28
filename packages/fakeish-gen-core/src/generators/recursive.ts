import type { GenContext, LazyNode, PipeNode, PromiseNode } from '../schema.js';

export const generateLazy = (ctx: GenContext<LazyNode>): unknown => {
  const innerNode = ctx.node.resolve();
  return ctx.generate(innerNode);
};

export const generatePromise = (ctx: GenContext<PromiseNode>): Promise<unknown> =>
  Promise.resolve(ctx.generate(ctx.node.inner));

export const generatePipe = (ctx: GenContext<PipeNode>): unknown => ctx.generate(ctx.node.input);
