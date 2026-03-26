import { Faker, type LocaleDefinition } from '@faker-js/faker';
import type { z } from 'zod/v4';
import { defaultConfig } from './config.js';
import { generateInvalid } from './generators/invalid.js';
import { resolve } from './resolve.js';
import type { FixtureGenerator, FixtureOptions, Generator, GeneratorConfig, ManyOptions, ZodDefType } from './types.js';

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

const createUnseededFaker = (locale: ReadonlyArray<LocaleDefinition>): Faker => new Faker({ locale: [...locale] });

const createFaker = (seed: number | undefined, locale: ReadonlyArray<LocaleDefinition>): Faker =>
  seed !== undefined ? createSeededFaker(seed, locale) : createUnseededFaker(locale);

const generateOne = <T>(schema: z.ZodType<T>, config: GeneratorConfig, faker: Faker, sequence = 0): T =>
  resolve(schema, config, [], 0, faker, sequence);

const getByDotPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);

const generateMany = <T>(
  schema: z.ZodType<T>,
  count: number,
  config: GeneratorConfig,
  faker: Faker,
  uniqueKeys?: ReadonlyArray<string>,
): ReadonlyArray<T> => {
  if (!uniqueKeys || uniqueKeys.length === 0) {
    return Array.from({ length: count }, (_, i) => resolve(schema, config, [], 0, faker, i) as T);
  }

  const maxAttempts = count * 10;
  const seen = new Map(uniqueKeys.map((k) => [k, new Set<unknown>()]));
  const results: Array<T> = [];

  for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt++) {
    const item = resolve(schema, config, [], 0, faker, results.length) as T;
    const isDuplicate = uniqueKeys.some((key) => seen.get(key)?.has(getByDotPath(item, key)) ?? false);

    if (!isDuplicate) {
      for (const key of uniqueKeys) {
        seen.get(key)?.add(getByDotPath(item, key));
      }
      results.push(item);
    }
  }

  if (results.length < count) {
    throw new Error(
      `Could not generate ${count} unique items for keys [${uniqueKeys.join(', ')}] after ${maxAttempts} attempts`,
    );
  }

  return results;
};

const createGenerator = <T>(schema: z.ZodType<T>, config: GeneratorConfig): FixtureGenerator<T> => ({
  one: (): T => {
    const f = createFaker(config.seed, config.locale);
    return generateOne(schema, config, f);
  },
  many: (count: number, options?: ManyOptions<T>): ReadonlyArray<T> => {
    const f = createFaker(config.seed, config.locale);
    return generateMany(schema, count, config, f, options?.unique as ReadonlyArray<string> | undefined);
  },
  seed: (seed: number): FixtureGenerator<T> => createGenerator(schema, { ...config, seed }),
  for: <U>(newSchema: z.ZodType<U>): FixtureGenerator<U> => createGenerator(newSchema, config),
  override: ((
    matcherOrKey: string | ((ctx: unknown) => boolean),
    generate: (ctx: unknown) => unknown,
  ): FixtureGenerator<T> =>
    createGenerator(schema, {
      ...config,
      overrides: [...config.overrides, { matcher: matcherOrKey, generate }],
    })) as FixtureGenerator<T>['override'],
  partialOverride: ((key: string, overrideMap: Record<string, (ctx: unknown) => unknown>): FixtureGenerator<T> =>
    createGenerator(schema, {
      ...config,
      overrides: [
        ...config.overrides,
        ...Object.entries(overrideMap).map(([subKey, generate]) => ({
          matcher: (ctx: { path: ReadonlyArray<string> }) => ctx.path.at(-2) === key && ctx.path.at(-1) === subKey,
          generate,
        })),
      ],
    })) as FixtureGenerator<T>['partialOverride'],
  generator: <D extends ZodDefType>(defType: D, gen: Generator<D>): FixtureGenerator<T> =>
    createGenerator(schema, {
      ...config,
      generators: { ...config.generators, [defType]: gen },
    }),
  maxDepth: (depth: number): FixtureGenerator<T> => createGenerator(schema, { ...config, maxDepth: depth }),
  locale: (locale: ReadonlyArray<LocaleDefinition>): FixtureGenerator<T> =>
    createGenerator(schema, { ...config, locale }),
  optionalRate: (rate: number): FixtureGenerator<T> => createGenerator(schema, { ...config, optionalRate: rate }),
  nullRate: (rate: number): FixtureGenerator<T> => createGenerator(schema, { ...config, nullRate: rate }),
  derive: ((key: string, compute: (obj: Record<string, unknown>) => unknown): FixtureGenerator<T> =>
    createGenerator(schema, {
      ...config,
      derivations: [...config.derivations, { key, compute }],
    })) as FixtureGenerator<T>['derive'],
  trait: ((name: string, overrides: Record<string, (ctx: unknown) => unknown>): FixtureGenerator<T> =>
    createGenerator(schema, {
      ...config,
      traits: {
        ...config.traits,
        [name]: Object.entries(overrides).map(([key, generate]) => ({ matcher: key, generate })),
      },
    })) as unknown as FixtureGenerator<T>['trait'],
  with: (...traitNames: ReadonlyArray<string>): FixtureGenerator<T> => {
    const traitOverrides = traitNames.flatMap((name) => {
      const trait = config.traits[name];
      if (!trait)
        throw new Error(`Unknown trait: "${name}". Available traits: [${Object.keys(config.traits).join(', ')}]`);
      return trait;
    });
    return createGenerator(schema, {
      ...config,
      overrides: [...config.overrides, ...traitOverrides],
    });
  },
  invalid: (): unknown => {
    const f = createFaker(config.seed, config.locale);
    return generateInvalid(schema, config, f);
  },
  invalidMany: (count: number): ReadonlyArray<unknown> => {
    const f = createFaker(config.seed, config.locale);
    return Array.from({ length: count }, () => generateInvalid(schema, config, f));
  },
});

const configFromOptions = (opts?: FixtureOptions): GeneratorConfig => ({
  ...defaultConfig,
  seed: opts?.seed,
  maxDepth: opts?.maxDepth ?? defaultConfig.maxDepth,
  locale: opts?.locale ?? defaultConfig.locale,
  semanticFieldDetection: opts?.semanticFieldDetection ?? defaultConfig.semanticFieldDetection,
  optionalRate: opts?.optionalRate ?? defaultConfig.optionalRate,
  nullRate: opts?.nullRate ?? defaultConfig.nullRate,
  derivations: opts?.derivations ?? defaultConfig.derivations,
  generators: { ...defaultConfig.generators, ...opts?.generators },
});

/**
 * Creates a {@link FixtureGenerator} for a Zod schema that produces realistic test data.
 * Returns an immutable, chainable builder for configuring seeds, overrides, traits, and more.
 *
 * Also available as `fixture.create()` with the same signature.
 *
 * @template T - The TypeScript type inferred from the Zod schema.
 * @param schema - The Zod schema to generate fixtures for.
 * @param opts - Optional configuration. See {@link FixtureOptions}.
 * @returns A {@link FixtureGenerator} bound to the schema and options.
 *
 * @example
 * ```ts
 * import { z } from 'zod/v4';
 * import { fixture } from '@l4n3/zodgen';
 *
 * const User = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number().min(18).max(99),
 * });
 *
 * // Generate a single user
 * const user = fixture(User).seed(42).one();
 *
 * // Generate 10 users with unique emails
 * const users = fixture(User).many(10, { unique: ['email'] });
 *
 * // Use fixture.create() — identical behavior
 * const gen = fixture.create(User, { seed: 1 });
 * ```
 */
export const fixture = Object.assign(
  <T>(schema: z.ZodType<T>, opts?: FixtureOptions): FixtureGenerator<T> =>
    createGenerator(schema, configFromOptions(opts)),
  {
    create: <T>(schema: z.ZodType<T>, opts?: FixtureOptions): FixtureGenerator<T> =>
      createGenerator(schema, configFromOptions(opts)),
  },
);
