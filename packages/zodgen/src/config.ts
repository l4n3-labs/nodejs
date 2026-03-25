import type { GeneratorConfig } from './types.js';

// TODO: Add a `generators` property (e.g. Partial<Record<ZodDefType, Generator>>) that allows
// overriding the default generator for any ZodDefType, so users can customize how specific
// schema types are generated without needing path-based overrides.

export const defaultConfig: GeneratorConfig = {
  seed: undefined,
  overrides: [],
};
