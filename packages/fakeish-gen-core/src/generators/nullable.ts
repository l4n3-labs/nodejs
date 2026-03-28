import type { CatchNode, DefaultNode, GenContext, NullableNode, OptionalNode, ReadonlyNode } from '../schema.js';

export const generateNullable = (ctx: GenContext<NullableNode>): unknown =>
  ctx.faker.number.float() < 1 - ctx.config.nullRate ? ctx.generate(ctx.node.inner) : null;

export const generateOptional = (ctx: GenContext<OptionalNode>): unknown =>
  ctx.faker.number.float() < ctx.config.optionalRate ? ctx.generate(ctx.node.inner) : undefined;

export const generateDefault = (ctx: GenContext<DefaultNode>): unknown => ctx.node.value;

export const generateReadonly = (ctx: GenContext<ReadonlyNode>): unknown => Object.freeze(ctx.generate(ctx.node.inner));

export const generateCatch = (ctx: GenContext<CatchNode>): unknown => ctx.generate(ctx.node.inner);
