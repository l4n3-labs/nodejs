import type { Faker } from '@faker-js/faker';
import type { z } from 'zod/v4';
import { createCheckSet } from '../context.js';
import { resolve } from '../resolve.js';
import type { GeneratorConfig } from '../types.js';

const extractChecks = (schema: z.ZodType): ReadonlyArray<z.core.$ZodCheck> =>
  ((schema as z.ZodType).def.checks ?? []) as ReadonlyArray<z.core.$ZodCheck>;

const pickRandom = <T>(faker: Faker, items: ReadonlyArray<T>): T =>
  items[faker.number.int({ min: 0, max: items.length - 1 })] as T;

const invalidateString = (schema: z.ZodType, faker: Faker): unknown => {
  const checks = createCheckSet(extractChecks(schema));
  const strategies: ReadonlyArray<() => unknown> = [
    () => faker.number.int(),
    ...(checks.has('min_length') ? [() => ''] : []),
    ...(checks.has('max_length') ? [() => faker.string.alpha(1000)] : []),
    ...(checks.has('string_format') ? [() => `not-a-valid-format-${faker.string.alpha(5)}`] : []),
  ];
  return pickRandom(faker, strategies)();
};

const invalidateNumber = (schema: z.ZodType, faker: Faker): unknown => {
  const checks = createCheckSet(extractChecks(schema));
  const strategies: ReadonlyArray<() => unknown> = [
    () => faker.string.alpha(5),
    ...(checks.has('greater_than')
      ? [
          () => {
            const gt = checks.find('greater_than');
            return gt ? Number(gt.value) - 1000 : -Infinity;
          },
        ]
      : []),
    ...(checks.has('less_than')
      ? [
          () => {
            const lt = checks.find('less_than');
            return lt ? Number(lt.value) + 1000 : Infinity;
          },
        ]
      : []),
    ...(checks.has('number_format') ? [() => faker.number.float({ min: 0.01, max: 0.99, fractionDigits: 2 })] : []),
  ];
  return pickRandom(faker, strategies)();
};

const invalidateObject = (schema: z.ZodType, config: GeneratorConfig, faker: Faker): unknown => {
  // biome-ignore lint/suspicious/noExplicitAny: accessing Zod v4 internals for object shape
  const def = (schema as any)._zod.def;
  const shape = def.shape as Record<string, z.ZodType> | undefined;
  if (!shape) return faker.string.alpha(5);

  const keys = Object.keys(shape);
  if (keys.length === 0) return faker.string.alpha(5);

  // Generate a valid object, then corrupt one random field
  const valid = resolve(schema, config, [], 0, faker) as Record<string, unknown>;
  const targetKey = pickRandom(faker, keys);
  const targetSchema = shape[targetKey];
  if (!targetSchema) return valid;

  const invalidValue = generateInvalid(targetSchema, config, faker);
  return { ...valid, [targetKey]: invalidValue };
};

const invalidateEnum = (schema: z.ZodType, faker: Faker): unknown => {
  // biome-ignore lint/suspicious/noExplicitAny: accessing Zod v4 internals for enum values
  const def = (schema as any)._zod.def;
  const entries = def.entries as Record<string, string> | undefined;
  const values = entries ? Object.values(entries) : [];
  const invalid = `not-in-enum-${faker.string.alpha(5)}`;
  return values.includes(invalid) ? `${invalid}-extra` : invalid;
};

const invalidateLiteral = (schema: z.ZodType, faker: Faker): unknown => {
  // biome-ignore lint/suspicious/noExplicitAny: accessing Zod v4 internals for literal value
  const def = (schema as any)._zod.def;
  const value = def.value ?? def.values?.[0];
  if (typeof value === 'string') return `${value}-invalid-${faker.string.alpha(3)}`;
  if (typeof value === 'number') return value + 9999;
  if (typeof value === 'boolean') return !value;
  return undefined;
};

const invalidateArray = (schema: z.ZodType, faker: Faker): unknown => {
  const checks = createCheckSet(extractChecks(schema));
  if (checks.has('min_length')) return [];
  if (checks.has('max_length')) {
    const maxCheck = checks.find('max_length');
    const max = maxCheck ? maxCheck.maximum : 10;
    return Array.from({ length: max + 10 }, () => faker.string.alpha(3));
  }
  return faker.string.alpha(5); // wrong type
};

export const generateInvalid = (schema: z.ZodType, config: GeneratorConfig, faker: Faker): unknown => {
  // biome-ignore lint/suspicious/noExplicitAny: accessing Zod v4 internals for def type
  const defType = (schema as any)._zod.def.type as string;
  switch (defType) {
    case 'string':
      return invalidateString(schema, faker);
    case 'number':
      return invalidateNumber(schema, faker);
    case 'object':
      return invalidateObject(schema, config, faker);
    case 'enum':
      return invalidateEnum(schema, faker);
    case 'literal':
      return invalidateLiteral(schema, faker);
    case 'array':
      return invalidateArray(schema, faker);
    case 'boolean':
      return faker.string.alpha(5);
    case 'date':
      return faker.string.alpha(5);
    default:
      return undefined;
  }
};
