import type { z } from 'zod/v4';

export type CompetitorAdapter = {
  readonly name: string;
  readonly available: boolean;
  readonly reason?: string;
  readonly generate: (schema: z.ZodType) => unknown;
  readonly generateMany: (schema: z.ZodType, count: number) => ReadonlyArray<unknown>;
  readonly supportsSeed: boolean;
  readonly supportsCustomOverrides: boolean;
  readonly supportsRecursive: boolean;
};

export type AdapterFactory = () => Promise<CompetitorAdapter>;

const unavailableGenerate = (): never => {
  throw new Error('Adapter not available');
};

const unavailableGenerateMany = (): never => {
  throw new Error('Adapter not available');
};

export const createUnavailableAdapter = (name: string, reason: string): CompetitorAdapter => ({
  name,
  available: false,
  reason,
  generate: unavailableGenerate,
  generateMany: unavailableGenerateMany,
  supportsSeed: false,
  supportsCustomOverrides: false,
  supportsRecursive: false,
});
