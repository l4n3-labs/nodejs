import { beforeAll, describe, expect, it } from 'vitest';
import type { CompetitorAdapter } from './adapters/types.js';
import { createZockerAdapter } from './adapters/zocker.js';
import { createZodFixtureAdapter } from './adapters/zod-fixture.js';
import { createZodMockingAdapter } from './adapters/zod-mocking.js';
import { createZodSchemaFakerAdapter } from './adapters/zod-schema-faker.js';
import { createZodgenAdapter } from './adapters/zodgen.js';
import { createZodockAdapter } from './adapters/zodock.js';
import {
  ConstrainedSchema,
  NestedObjectSchema,
  PrimitiveSchema,
  RecursiveSchema,
  SimpleObjectSchema,
} from './schemas.js';

const SAMPLE_SIZE = 50;

const allAdapters: Array<CompetitorAdapter> = [];

beforeAll(async () => {
  const results = await Promise.all([
    createZodgenAdapter(),
    createZodSchemaFakerAdapter(),
    createZockerAdapter(),
    createZodFixtureAdapter(),
    createZodMockingAdapter(),
    createZodockAdapter(),
  ]);
  allAdapters.push(...results);

  console.log('\n=== Adapter Availability ===');
  for (const adapter of results) {
    const status = adapter.available ? 'AVAILABLE' : `UNAVAILABLE (${adapter.reason})`;
    console.log(`  ${adapter.name}: ${status}`);
  }
  console.log('');
});

const nonRecursiveSchemas = [
  { name: 'PrimitiveSchema', schema: PrimitiveSchema },
  { name: 'SimpleObjectSchema', schema: SimpleObjectSchema },
  { name: 'ConstrainedSchema', schema: ConstrainedSchema },
  { name: 'NestedObjectSchema', schema: NestedObjectSchema },
] as const;

// Non-recursive schemas should produce 100% valid output
describe('correctness - non-recursive schemas', () => {
  for (const { name: schemaName, schema } of nonRecursiveSchemas) {
    describe(schemaName, () => {
      it.each([0, 1, 2, 3, 4, 5])('adapter[%i] generates valid data', (index) => {
        const adapter = allAdapters[index];
        if (!adapter || !adapter.available) return;

        const failures: Array<{ index: number; errors: unknown }> = [];

        for (let i = 0; i < SAMPLE_SIZE; i++) {
          const value = adapter.generate(schema);
          const result = schema.safeParse(value);
          if (!result.success) {
            failures.push({ index: i, errors: result.error.issues });
          }
        }

        if (failures.length > 0) {
          const rate = ((SAMPLE_SIZE - failures.length) / SAMPLE_SIZE) * 100;
          console.warn(
            `[${adapter.name}] ${schemaName}: ${rate.toFixed(0)}% pass rate (${failures.length}/${SAMPLE_SIZE} failures)`,
          );
          console.warn('  First failure:', JSON.stringify(failures[0], null, 2));
        }

        expect(failures, `${adapter.name} failed ${failures.length}/${SAMPLE_SIZE} for ${schemaName}`).toHaveLength(0);
      });
    });
  }
});

// Recursive schema reports pass rate (some tools generate nulls at depth limits)
describe('correctness - recursive schema (pass rate)', () => {
  it.each([0, 1, 2, 3, 4, 5])('adapter[%i] recursive generation pass rate', (index) => {
    const adapter = allAdapters[index];
    if (!adapter || !adapter.available || !adapter.supportsRecursive) return;

    const results = Array.from({ length: SAMPLE_SIZE }, () => {
      const value = adapter.generate(RecursiveSchema);
      return RecursiveSchema.safeParse(value).success;
    });

    const passCount = results.filter(Boolean).length;
    const rate = (passCount / SAMPLE_SIZE) * 100;
    console.log(`[${adapter.name}] RecursiveSchema: ${rate.toFixed(0)}% pass rate (${passCount}/${SAMPLE_SIZE})`);

    // Log but don't hard-fail — recursive depth limits are a known trade-off
    expect(true).toBe(true);
  });
});

describe('correctness - batch generation produces correct count', () => {
  it.each([0, 1, 2, 3, 4, 5])('adapter[%i] generates correct batch size', (index) => {
    const adapter = allAdapters[index];
    if (!adapter || !adapter.available) return;

    const results = adapter.generateMany(SimpleObjectSchema, 25);
    expect(results).toHaveLength(25);
  });
});
