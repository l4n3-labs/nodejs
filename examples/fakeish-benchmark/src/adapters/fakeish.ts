import { fixture } from '@l4n3/fakeish';
import type { z } from 'zod/v4';
import type { AdapterFactory } from './types.js';

export const createFakeishAdapter: AdapterFactory = async () => ({
  name: 'fakeish',
  available: true,
  generate: (schema: z.ZodType) => fixture(schema, { seed: 42 }).one(),
  generateMany: (schema: z.ZodType, count: number) => fixture(schema, { seed: 42 }).many(count),
  supportsSeed: true,
  supportsCustomOverrides: true,
  supportsRecursive: true,
});
