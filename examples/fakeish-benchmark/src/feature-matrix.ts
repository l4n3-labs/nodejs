import { z } from 'zod/v4';
import { createFakeishAdapter } from './adapters/fakeish.js';
import type { CompetitorAdapter } from './adapters/types.js';
import { createZockerAdapter } from './adapters/zocker.js';
import { createZodFixtureAdapter } from './adapters/zod-fixture.js';
import { createZodMockingAdapter } from './adapters/zod-mocking.js';
import { createZodSchemaFakerAdapter } from './adapters/zod-schema-faker.js';
import { createZodockAdapter } from './adapters/zodock.js';

const tryGenerate = (adapter: CompetitorAdapter, schema: z.ZodType): boolean => {
  if (!adapter.available) return false;
  try {
    const value = adapter.generate(schema);
    return schema.safeParse(value).success;
  } catch {
    return false;
  }
};

type TreeNode = { readonly value: string; readonly children: ReadonlyArray<TreeNode> };
const recursiveSchema: z.ZodType<TreeNode> = z.object({
  value: z.string(),
  children: z.array(z.lazy(() => recursiveSchema)),
});

const features = [
  { name: 'Zod v4 compatible', test: (a: CompetitorAdapter) => a.available },
  { name: 'Seeding support', test: (a: CompetitorAdapter) => a.supportsSeed },
  { name: 'Custom overrides', test: (a: CompetitorAdapter) => a.supportsCustomOverrides },
  { name: 'z.string()', test: (a: CompetitorAdapter) => tryGenerate(a, z.string()) },
  { name: 'z.number()', test: (a: CompetitorAdapter) => tryGenerate(a, z.number()) },
  { name: 'z.boolean()', test: (a: CompetitorAdapter) => tryGenerate(a, z.boolean()) },
  { name: 'z.date()', test: (a: CompetitorAdapter) => tryGenerate(a, z.date()) },
  { name: 'z.bigint()', test: (a: CompetitorAdapter) => tryGenerate(a, z.bigint()) },
  { name: 'z.email()', test: (a: CompetitorAdapter) => tryGenerate(a, z.email()) },
  { name: 'z.uuid()', test: (a: CompetitorAdapter) => tryGenerate(a, z.uuid()) },
  { name: 'z.url()', test: (a: CompetitorAdapter) => tryGenerate(a, z.url()) },
  { name: 'z.ipv4()', test: (a: CompetitorAdapter) => tryGenerate(a, z.ipv4()) },
  { name: 'z.ipv6()', test: (a: CompetitorAdapter) => tryGenerate(a, z.ipv6()) },
  {
    name: 'z.iso.datetime()',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.iso.datetime()),
  },
  {
    name: 'z.string().min(5).max(10)',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.string().min(5).max(10)),
  },
  {
    name: 'z.string().startsWith("pre_")',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.string().startsWith('pre_')),
  },
  {
    name: 'z.number().int().min(0).max(100)',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.number().int().min(0).max(100)),
  },
  {
    name: 'z.number().multipleOf(5)',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.number().int().multipleOf(5)),
  },
  {
    name: 'z.enum()',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.enum(['a', 'b', 'c'])),
  },
  {
    name: 'z.union()',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.union([z.string(), z.number()])),
  },
  {
    name: 'z.array()',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.array(z.string()).min(1).max(3)),
  },
  {
    name: 'z.tuple()',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.tuple([z.string(), z.number()])),
  },
  {
    name: 'z.set()',
    test: (a: CompetitorAdapter) => {
      if (!a.available) return false;
      try {
        const value = a.generate(z.set(z.string()));
        return value instanceof Set;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'z.map()',
    test: (a: CompetitorAdapter) => {
      if (!a.available) return false;
      try {
        const value = a.generate(z.map(z.string(), z.number()));
        return value instanceof Map;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'z.record()',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.record(z.string(), z.number())),
  },
  {
    name: 'z.optional()',
    test: (a: CompetitorAdapter) => {
      if (!a.available) return false;
      try {
        // Generate many to check it doesn't always throw
        for (let i = 0; i < 10; i++) a.generate(z.string().optional());
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'z.nullable()',
    test: (a: CompetitorAdapter) => {
      if (!a.available) return false;
      try {
        for (let i = 0; i < 10; i++) a.generate(z.string().nullable());
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'z.lazy() (recursive)',
    test: (a: CompetitorAdapter) => {
      if (!a.available) return false;
      try {
        a.generate(recursiveSchema);
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'z.object() (nested)',
    test: (a: CompetitorAdapter) =>
      tryGenerate(
        a,
        z.object({
          a: z.object({ b: z.object({ c: z.string() }) }),
        }),
      ),
  },
  {
    name: 'z.literal()',
    test: (a: CompetitorAdapter) => tryGenerate(a, z.literal('hello')),
  },
] as const;

const run = async () => {
  const adapters = await Promise.all([
    createFakeishAdapter(),
    createZodSchemaFakerAdapter(),
    createZockerAdapter(),
    createZodFixtureAdapter(),
    createZodMockingAdapter(),
    createZodockAdapter(),
  ]);

  const names = adapters.map((a) => a.name);
  const headerRow = `| Feature | ${names.join(' | ')} |`;
  const separatorRow = `|---------|${names.map(() => '---').join('|')}|`;

  const rows = features.map((feature) => {
    const results = adapters.map((adapter) => (feature.test(adapter) ? 'Y' : 'N'));
    return `| ${feature.name} | ${results.join(' | ')} |`;
  });

  console.log('\n# Feature Matrix\n');
  console.log(headerRow);
  console.log(separatorRow);
  for (const row of rows) {
    console.log(row);
  }

  // Summary
  console.log('\n## Summary\n');
  for (const adapter of adapters) {
    const passCount = features.filter((f) => f.test(adapter)).length;
    const status = adapter.available ? `${passCount}/${features.length} features` : `UNAVAILABLE: ${adapter.reason}`;
    console.log(`- **${adapter.name}**: ${status}`);
  }
};

run().catch(console.error);
