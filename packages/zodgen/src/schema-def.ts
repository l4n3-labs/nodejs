import type { z } from 'zod/v4';

// Single point of cast for accessing Zod v4 schema internals.
// All generators use this instead of `(ctx.schema as any)._zod.def`.
export const schemaDef = <D extends z.core.$ZodTypeDef>(schema: z.ZodType): D =>
  // biome-ignore lint/suspicious/noExplicitAny: accessing Zod v4 internals requires bypassing the public type surface
  (schema as any)._zod.def;
