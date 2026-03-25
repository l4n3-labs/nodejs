import { z } from 'zod/v4';
import { type AdapterFactory, createUnavailableAdapter } from './types.js';

export const createZodockAdapter: AdapterFactory = async () => {
  try {
    const mod = await import('zodock');
    const createMock = mod.createMock as (schema: z.ZodType) => unknown;
    // Verify it works with Zod v4
    createMock(z.string());
    return {
      name: 'zodock',
      available: true,
      generate: (schema: z.ZodType) => createMock(schema),
      generateMany: (schema: z.ZodType, count: number) => Array.from({ length: count }, () => createMock(schema)),
      supportsSeed: false,
      supportsCustomOverrides: false,
      supportsRecursive: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createUnavailableAdapter('zodock', `Import/init failed: ${message}`);
  }
};
