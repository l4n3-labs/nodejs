import { base, en } from '@faker-js/faker';
import type { GeneratorConfig } from './types.js';

export const defaultConfig: GeneratorConfig = {
  seed: undefined,
  maxDepth: 10,
  locale: [en, base],
  semanticFieldDetection: true,
  overrides: [],
  generators: {},
};
