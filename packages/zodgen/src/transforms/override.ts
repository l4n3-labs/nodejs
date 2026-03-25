import type { GenContext, OverrideMatcher, Transform } from '../types.js';

export const override =
  <T>(matcher: OverrideMatcher<T>, generate: (ctx: GenContext<T>) => unknown): Transform =>
  (config) => ({
    ...config,
    overrides: [...config.overrides, { matcher, generate }],
  });
