import { base, en, Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import { applyTransforms, defaultConfig } from './config.js';
import { resolve } from './resolve.js';
import type { FixtureGenerator, FixtureOptions, GeneratorConfig, Transform } from './types.js';

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

export const fixture = Object.assign(
  <T>(schema: z.ZodType<T>, opts?: FixtureOptions): T => {
    const f = createFaker(opts?.seed);
    return generateOne(schema, defaultConfig, f);
  },
  {
    many: <T>(schema: z.ZodType<T>, count: number, opts?: FixtureOptions): ReadonlyArray<T> => {
      const f = createFaker(opts?.seed);
      return generateMany(schema, count, defaultConfig, f);
    },
    create: (...transforms: ReadonlyArray<Transform>): FixtureGenerator => {
      const config = applyTransforms(transforms);
      return {
        one: <T>(schema: z.ZodType<T>): T => {
          const f = createFaker(config.seed);
          return generateOne(schema, config, f);
        },
        many: <T>(schema: z.ZodType<T>, count: number): ReadonlyArray<T> => {
          const f = createFaker(config.seed);
          return generateMany(schema, count, config, f);
        },
      };
    },
  },
);
