import { base, en } from '@faker-js/faker';
import type { GeneratorConfig } from './schema.js';

export const defaultConfig: GeneratorConfig = {
  seed: undefined,
  maxDepth: 10,
  locale: [en, base],
  semanticFieldDetection: true,
  optionalRate: 0.8,
  nullRate: 0.2,
  overrides: [],
  derivations: [],
  traits: {},
  generators: {},
};
