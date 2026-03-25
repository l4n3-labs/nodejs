import { base, en, Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import { defaultConfig } from './config.js';
import { resolve } from './resolve.js';
import type { FixtureGenerator, FixtureOptions, Generator, GeneratorConfig, ManyOptions, ZodDefType } from './types.js';

const fakerCache = new Map<number, Faker>();

const createSeededFaker = (seed: number): Faker => {
  const cached = fakerCache.get(seed);
  if (cached) {
    cached.seed(seed);
    return cached;
  }
  const f = new Faker({ locale: [en, base] });
  f.seed(seed);
  fakerCache.set(seed, f);
  return f;
};

const createUnseededFaker = (): Faker => new Faker({ locale: [en, base] });

const createFaker = (seed: number | undefined): Faker =>
  seed !== undefined ? createSeededFaker(seed) : createUnseededFaker();

const generateOne = <T>(schema: z.ZodType<T>, config: GeneratorConfig, faker: Faker): T =>
  resolve(schema, config, [], 0, faker);

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
    return Array.from({ length: count }, () => resolve(schema, config, [], 0, faker) as T);
  }

  const maxAttempts = count * 10;
  const seen = new Map(uniqueKeys.map((k) => [k, new Set<unknown>()]));
  const results: Array<T> = [];

  for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt++) {
    const item = resolve(schema, config, [], 0, faker) as T;
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
    const f = createFaker(config.seed);
    return generateOne(schema, config, f);
  },
  many: (count: number, options?: ManyOptions<T>): ReadonlyArray<T> => {
    const f = createFaker(config.seed);
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
});

const configFromOptions = (opts?: FixtureOptions): GeneratorConfig => ({
  ...defaultConfig,
  seed: opts?.seed,
  generators: { ...defaultConfig.generators, ...opts?.generators },
});

export const fixture = Object.assign(
  <T>(schema: z.ZodType<T>, opts?: FixtureOptions): FixtureGenerator<T> =>
    createGenerator(schema, configFromOptions(opts)),
  {
    create: <T>(schema: z.ZodType<T>, opts?: FixtureOptions): FixtureGenerator<T> =>
      createGenerator(schema, configFromOptions(opts)),
  },
);
