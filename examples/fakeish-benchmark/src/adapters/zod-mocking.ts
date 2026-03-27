import { z } from 'zod/v4';
import { type AdapterFactory, createUnavailableAdapter } from './types.js';

export const createZodMockingAdapter: AdapterFactory = async () => {
  try {
    const mod = await import('zod-mocking');
    const mockValid = mod.mockValid as ((schema: z.ZodType) => unknown) | undefined;
    const generate = mockValid ?? (mod.default as { mockValid: (schema: z.ZodType) => unknown }).mockValid;
    // Verify it actually produces valid output with Zod v4
    const testSchema = z.object({ name: z.string(), age: z.number() });
    const testResult = generate(testSchema);
    const parsed = testSchema.safeParse(testResult);
    if (!parsed.success) {
      return createUnavailableAdapter('zod-mocking', 'Generates invalid data with Zod v4');
    }
    return {
      name: 'zod-mocking',
      available: true,
      generate: (schema: z.ZodType) => generate(schema),
      generateMany: (schema: z.ZodType, count: number) => Array.from({ length: count }, () => generate(schema)),
      supportsSeed: true,
      supportsCustomOverrides: false,
      supportsRecursive: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createUnavailableAdapter('zod-mocking', `Import/init failed: ${message}`);
  }
};
