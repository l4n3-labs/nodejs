import { base, en, Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import { defaultConfig } from './config.js';
import { resolve } from './resolve.js';
import type { FixtureGenerator, FixtureOptions, GeneratorConfig } from './types.js';

const createFaker = (seed: number | undefined): Faker => {
  const f = new Faker({ locale: [en, base] });
  if (seed !== undefined) f.seed(seed);
  return f;
};

const generateOne = <T>(schema: z.ZodType<T>, config: GeneratorConfig, faker: Faker): T =>
  resolve(schema, config, [], 0, faker) as T;

const generateMany = <T>(
  schema: z.ZodType<T>,
  count: number,
  config: GeneratorConfig,
  faker: Faker,
): ReadonlyArray<T> => Array.from({ length: count }, () => resolve(schema, config, [], 0, faker) as T);

const createGenerator = <T>(schema: z.ZodType<T>, config: GeneratorConfig): FixtureGenerator<T> => ({
  one: (): T => {
    const f = createFaker(config.seed);
    return generateOne(schema, config, f);
  },
  many: (count: number): ReadonlyArray<T> => {
    const f = createFaker(config.seed);
    return generateMany(schema, count, config, f);
  },
  seed: (seed: number): FixtureGenerator<T> => createGenerator(schema, { ...config, seed }),
  override: ((
    matcherOrKey: string | ((ctx: unknown) => boolean),
    generate: (ctx: unknown) => unknown,
  ): FixtureGenerator<T> =>
    createGenerator(schema, {
      ...config,
      overrides: [...config.overrides, { matcher: matcherOrKey, generate }],
    })) as FixtureGenerator<T>['override'],
});

export const fixture = Object.assign(
  <T>(schema: z.ZodType<T>, opts?: FixtureOptions): FixtureGenerator<T> =>
    createGenerator(schema, { ...defaultConfig, seed: opts?.seed }),
  {
    create: <T>(schema: z.ZodType<T>, opts?: FixtureOptions): FixtureGenerator<T> =>
      createGenerator(schema, { ...defaultConfig, seed: opts?.seed }),
  },
);
