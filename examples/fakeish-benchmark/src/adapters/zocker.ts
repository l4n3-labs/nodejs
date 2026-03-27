import { z } from 'zod/v4';
import { type AdapterFactory, createUnavailableAdapter } from './types.js';

export const createZockerAdapter: AdapterFactory = async () => {
  try {
    const mod = await import('zocker');
    const zock = mod.zocker as (schema: z.ZodType) => { generate: () => unknown };
    // Verify it works
    zock(z.string()).generate();
    return {
      name: 'zocker',
      available: true,
      generate: (schema: z.ZodType) => zock(schema).generate(),
      generateMany: (schema: z.ZodType, count: number) => Array.from({ length: count }, () => zock(schema).generate()),
      supportsSeed: true,
      supportsCustomOverrides: true,
      supportsRecursive: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createUnavailableAdapter('zocker', `Import/init failed: ${message}`);
  }
};
