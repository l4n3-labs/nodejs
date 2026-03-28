import { Faker, type LocaleDefinition } from '@faker-js/faker';
import { defaultConfig } from './config.js';
import { resolve } from './resolve.js';
import type {
  FixtureGenerator,
  FixtureOptions,
  Generator,
  GeneratorConfig,
  ManyOptions,
  NodeType,
  SchemaNode,
} from './schema.js';

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

const getByDotPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);

const generateMany = <T>(
  node: SchemaNode,
  count: number,
  config: GeneratorConfig,
  faker: Faker,
  uniqueKeys?: ReadonlyArray<string>,
): ReadonlyArray<T> => {
  if (!uniqueKeys || uniqueKeys.length === 0) {
    return Array.from({ length: count }, (_, i) => resolve(node, config, [], 0, faker, i) as T);
  }

  const maxAttempts = count * 10;
  const seen = new Map(uniqueKeys.map((k) => [k, new Set<unknown>()]));
  const results: Array<T> = [];

  for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt++) {
    const item = resolve(node, config, [], 0, faker, results.length) as T;
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

export const createGenerator = <T>(node: SchemaNode, config: GeneratorConfig): FixtureGenerator<T> => ({
  one: (): T => {
    const f = createFaker(config.seed, config.locale);
    return resolve(node, config, [], 0, f) as T;
  },
  many: (count: number, options?: ManyOptions<T>): ReadonlyArray<T> => {
    const f = createFaker(config.seed, config.locale);
    return generateMany<T>(node, count, config, f, options?.unique as ReadonlyArray<string> | undefined);
  },
  seed: (seed: number): FixtureGenerator<T> => createGenerator(node, { ...config, seed }),
  override: ((matcherOrKey: string | ((ctx: unknown) => boolean), generate: (ctx: unknown) => unknown) =>
    createGenerator(node, {
      ...config,
      overrides: [...config.overrides, { matcher: matcherOrKey, generate }],
    })) as FixtureGenerator<T>['override'],
  partialOverride: ((key: string, overrideMap: Record<string, (ctx: unknown) => unknown>) =>
    createGenerator(node, {
      ...config,
      overrides: [
        ...config.overrides,
        ...Object.entries(overrideMap).map(([subKey, generate]) => ({
          matcher: (ctx: { path: ReadonlyArray<string> }) => ctx.path.at(-2) === key && ctx.path.at(-1) === subKey,
          generate,
        })),
      ],
    })) as FixtureGenerator<T>['partialOverride'],
  generator: (nodeType: NodeType, gen: Generator): FixtureGenerator<T> =>
    createGenerator(node, {
      ...config,
      generators: { ...config.generators, [nodeType]: gen },
    }),
  maxDepth: (depth: number): FixtureGenerator<T> => createGenerator(node, { ...config, maxDepth: depth }),
  locale: (locale: ReadonlyArray<LocaleDefinition>): FixtureGenerator<T> =>
    createGenerator(node, { ...config, locale }),
  optionalRate: (rate: number): FixtureGenerator<T> => createGenerator(node, { ...config, optionalRate: rate }),
  nullRate: (rate: number): FixtureGenerator<T> => createGenerator(node, { ...config, nullRate: rate }),
  derive: ((key: string, compute: (obj: Record<string, unknown>) => unknown) =>
    createGenerator(node, {
      ...config,
      derivations: [...config.derivations, { key, compute }],
    })) as FixtureGenerator<T>['derive'],
  trait: ((name: string, overrides: Record<string, (ctx: unknown) => unknown>) =>
    createGenerator(node, {
      ...config,
      traits: {
        ...config.traits,
        [name]: Object.entries(overrides).map(([traitKey, generate]) => ({ matcher: traitKey, generate })),
      },
    })) as unknown as FixtureGenerator<T>['trait'],
  with: (...traitNames: ReadonlyArray<string>): FixtureGenerator<T> => {
    const traitOverrides = traitNames.flatMap((name) => {
      const trait = config.traits[name];
      if (!trait)
        throw new Error(`Unknown trait: "${name}". Available traits: [${Object.keys(config.traits).join(', ')}]`);
      return trait;
    });
    return createGenerator(node, {
      ...config,
      overrides: [...config.overrides, ...traitOverrides],
    });
  },
});

export const configFromOptions = (opts?: FixtureOptions): GeneratorConfig => ({
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

export const fixture = <T = unknown>(node: SchemaNode, opts?: FixtureOptions): FixtureGenerator<T> =>
  createGenerator<T>(node, configFromOptions(opts));
