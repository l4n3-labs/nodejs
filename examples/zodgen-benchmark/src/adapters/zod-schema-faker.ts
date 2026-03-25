import { faker } from '@faker-js/faker';
import { z } from 'zod/v4';
import { type AdapterFactory, createUnavailableAdapter } from './types.js';

export const createZodSchemaFakerAdapter: AdapterFactory = async () => {
  try {
    // zod-schema-faker v4 entry point requires explicit faker setup
    const mod = await import('zod-schema-faker/v4');
    const fake = mod.fake as (schema: z.ZodType) => unknown;
    const setFaker = mod.setFaker as (f: typeof faker) => void;
    setFaker(faker);
    // Verify it works with a basic schema
    fake(z.string());
    return {
      name: 'zod-schema-faker',
      available: true,
      generate: (schema: z.ZodType) => fake(schema),
      generateMany: (schema: z.ZodType, count: number) => Array.from({ length: count }, () => fake(schema)),
      supportsSeed: true,
      supportsCustomOverrides: true,
      supportsRecursive: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createUnavailableAdapter('zod-schema-faker', `Import/init failed: ${message}`);
  }
};
