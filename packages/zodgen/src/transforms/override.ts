import type { GenContext, OverrideMatcher, Transform } from '../types.js';

export const override =
  (matcher: OverrideMatcher, generate: (ctx: GenContext) => unknown): Transform =>
  (config) => ({
    ...config,
    overrides: [...config.overrides, { matcher, generate }],
  });
