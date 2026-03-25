import { z } from 'zod/v4';
import { type AdapterFactory, createUnavailableAdapter } from './types.js';

export const createZodFixtureAdapter: AdapterFactory = async () => {
  try {
    const mod = await import('zod-fixture');
    const createFixture = mod.createFixture as (schema: z.ZodType) => unknown;
    // Verify it works with Zod v4
    createFixture(z.string());
    return {
      name: 'zod-fixture',
      available: true,
      generate: (schema: z.ZodType) => createFixture(schema),
      generateMany: (schema: z.ZodType, count: number) => Array.from({ length: count }, () => createFixture(schema)),
      supportsSeed: true,
      supportsCustomOverrides: true,
      supportsRecursive: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createUnavailableAdapter('zod-fixture', `Import/init failed: ${message}`);
  }
};
