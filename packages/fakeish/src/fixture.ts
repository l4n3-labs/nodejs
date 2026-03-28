import { Faker, type LocaleDefinition } from '@faker-js/faker';
import {
  configFromOptions as coreConfigFromOptions,
  createGenerator as coreCreateGenerator,
  type GenContext,
  type GeneratorConfig,
  type NodeType,
  type NumberNode,
  type StringNode,
} from '@l4n3/fakeish-gen-core';
import { generateNumber as coreGenerateNumber } from '@l4n3/fakeish-gen-core/generators/number';
import { generateString as coreGenerateString } from '@l4n3/fakeish-gen-core/generators/string';
import type { z } from 'zod/v4';
import { toNode } from './adapter.js';
import { generateInvalid } from './generators/invalid.js';
import { findSemanticNumber, findSemanticString } from './generators/semantic.js';
import type { FixtureOptions, ZodFixtureGenerator } from './types.js';

const semanticStringGenerator = (ctx: GenContext<StringNode>): unknown => {
  if (ctx.config.semanticFieldDetection) {
    const { constraints } = ctx.node;
    const hasFormats = constraints.format !== undefined;
    const hasLengthConstraints =
      constraints.minLength !== undefined ||
      constraints.maxLength !== undefined ||
      constraints.exactLength !== undefined;

    if (!hasFormats && !hasLengthConstraints) {
      const fieldName = ctx.path.at(-1);
      if (fieldName) {
        const semanticGen = findSemanticString(fieldName);
        if (semanticGen) return semanticGen(ctx.faker);
      }
    }
  }
  return coreGenerateString(ctx);
};

const semanticNumberGenerator = (ctx: GenContext<NumberNode>): unknown => {
  if (ctx.config.semanticFieldDetection) {
    const { constraints } = ctx.node;
    const hasRangeConstraints = constraints.minimum !== undefined || constraints.maximum !== undefined;

    if (!hasRangeConstraints) {
      const fieldName = ctx.path.at(-1);
      if (fieldName) {
        const semanticGen = findSemanticNumber(fieldName);
        if (semanticGen) return semanticGen(ctx.faker);
      }
    }
  }
  return coreGenerateNumber(ctx);
};

const fakerCache = new Map<number, Map<LocaleDefinition, Faker>>();

const createSeededFaker = (seed: number, locale: ReadonlyArray<LocaleDefinition>): Faker => {
  const primary = locale[0];
  const seedMap = fakerCache.get(seed) ?? new Map<LocaleDefinition, Faker>();
  const cached = primary ? seedMap.get(primary) : undefined;
  if (cached) {
    cached.seed(seed);
    return cached;
  }
  const f = new Faker({ locale: [...locale] });
  f.seed(seed);
  if (primary) {
    seedMap.set(primary, f);
    fakerCache.set(seed, seedMap);
  }
  return f;
};

const createFaker = (seed: number | undefined, locale: ReadonlyArray<LocaleDefinition>): Faker =>
  seed !== undefined ? createSeededFaker(seed, locale) : new Faker({ locale: [...locale] });

const configFromOptions = (opts?: FixtureOptions): GeneratorConfig => {
  const base = coreConfigFromOptions(opts);
  return {
    ...base,
    generators: {
      // biome-ignore lint/suspicious/noExplicitAny: semantic generators are typed internally
      string: semanticStringGenerator as any,
      // biome-ignore lint/suspicious/noExplicitAny: semantic generators are typed internally
      number: semanticNumberGenerator as any,
      ...opts?.generators,
    },
  };
};

const createZodGenerator = <T>(schema: z.ZodType<T>, config: GeneratorConfig): ZodFixtureGenerator<T> => {
  const node = toNode(schema);
  const coreGen = coreCreateGenerator<T>(node, config);

  return {
    ...coreGen,
    for: <U>(newSchema: z.ZodType<U>): ZodFixtureGenerator<U> => createZodGenerator(newSchema, config),
    invalid: (): unknown => {
      const f = createFaker(config.seed, config.locale);
      return generateInvalid(schema, config, f);
    },
    invalidMany: (count: number): ReadonlyArray<unknown> => {
      const f = createFaker(config.seed, config.locale);
      return Array.from({ length: count }, () => generateInvalid(schema, config, f));
    },
    // Re-wrap mutating methods to return ZodFixtureGenerator (with .for/.invalid)
    seed: (seed: number) => createZodGenerator(schema, { ...config, seed }),
    override: ((matcherOrKey: string | ((ctx: unknown) => boolean), generate: (ctx: unknown) => unknown) =>
      createZodGenerator(schema, {
        ...config,
        overrides: [...config.overrides, { matcher: matcherOrKey, generate }],
      })) as ZodFixtureGenerator<T>['override'],
    partialOverride: ((key: string, overrideMap: Record<string, (ctx: unknown) => unknown>) =>
      createZodGenerator(schema, {
        ...config,
        overrides: [
          ...config.overrides,
          ...Object.entries(overrideMap).map(([subKey, generate]) => ({
            matcher: (ctx: { path: ReadonlyArray<string> }) => ctx.path.at(-2) === key && ctx.path.at(-1) === subKey,
            generate,
          })),
        ],
      })) as ZodFixtureGenerator<T>['partialOverride'],
    generator: (nodeType: NodeType, gen: unknown) =>
      createZodGenerator(schema, {
        ...config,
        generators: { ...config.generators, [nodeType]: gen },
      }),
    maxDepth: (depth: number) => createZodGenerator(schema, { ...config, maxDepth: depth }),
    locale: (locale: ReadonlyArray<LocaleDefinition>) => createZodGenerator(schema, { ...config, locale }),
    optionalRate: (rate: number) => createZodGenerator(schema, { ...config, optionalRate: rate }),
    nullRate: (rate: number) => createZodGenerator(schema, { ...config, nullRate: rate }),
    derive: ((key: string, compute: (obj: Record<string, unknown>) => unknown) =>
      createZodGenerator(schema, {
        ...config,
        derivations: [...config.derivations, { key, compute }],
      })) as ZodFixtureGenerator<T>['derive'],
    trait: ((name: string, overrides: Record<string, (ctx: unknown) => unknown>) =>
      createZodGenerator(schema, {
        ...config,
        traits: {
          ...config.traits,
          [name]: Object.entries(overrides).map(([traitKey, generate]) => ({ matcher: traitKey, generate })),
        },
      })) as unknown as ZodFixtureGenerator<T>['trait'],
    with: (...traitNames: ReadonlyArray<string>) => {
      const traitOverrides = traitNames.flatMap((name) => {
        const trait = config.traits[name];
        if (!trait)
          throw new Error(`Unknown trait: "${name}". Available traits: [${Object.keys(config.traits).join(', ')}]`);
        return trait;
      });
      return createZodGenerator(schema, {
        ...config,
        overrides: [...config.overrides, ...traitOverrides],
      });
    },
  };
};

/**
 * Creates a {@link ZodFixtureGenerator} from a Zod schema. This is the main entry point
 * for the `@l4n3/fakeish` package. Also available as `fixture.create()`.
 *
 * @param schema - The Zod schema to generate fixture data for.
 * @param opts - Optional configuration (seed, locale, rates, etc.).
 * @returns A chainable generator with `.one()`, `.many()`, and configuration methods.
 *
 * @example
 * ```ts
 * import { fixture } from '@l4n3/fakeish';
 * import { z } from 'zod';
 *
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.email(),
 *   age: z.number().int().min(18).max(99),
 * });
 *
 * const user = fixture(userSchema).one();
 * const users = fixture(userSchema, { seed: 42 }).many(10);
 * ```
 */
export const fixture = Object.assign(
  <T>(schema: z.ZodType<T>, opts?: FixtureOptions): ZodFixtureGenerator<T> =>
    createZodGenerator(schema, configFromOptions(opts)),
  {
    create: <T>(schema: z.ZodType<T>, opts?: FixtureOptions): ZodFixtureGenerator<T> =>
      createZodGenerator(schema, configFromOptions(opts)),
  },
);
