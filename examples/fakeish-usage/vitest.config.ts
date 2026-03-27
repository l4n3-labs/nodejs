import { sharedVitestConfig } from '@l4n3/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(sharedVitestConfig, defineConfig({}));
