import { sharedVitestConfig } from '@l4n3/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  sharedVitestConfig,
  defineConfig({
    test: {
      coverage: {
        provider: 'v8',
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.test.ts', 'src/generators/registry.ts', 'src/index.ts', 'src/types.ts'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  }),
);
