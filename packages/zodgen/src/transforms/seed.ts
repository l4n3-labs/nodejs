import type { Transform } from '../types.js';

export const withSeed =
  (seed: number): Transform =>
  (config) => ({
    ...config,
    seed,
  });
