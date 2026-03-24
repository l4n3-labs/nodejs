import type { GeneratorConfig, Transform } from './types.js';

export const defaultConfig: GeneratorConfig = {
  seed: undefined,
  overrides: [],
};

export const applyTransforms = (transforms: ReadonlyArray<Transform>): GeneratorConfig =>
  transforms.reduce<GeneratorConfig>((config, transform) => transform(config), defaultConfig);
