import type { Faker } from '@faker-js/faker';
import type { GeneratorConfig } from '@l4n3/gen-core';
import { resolve } from '@l4n3/gen-core/resolve';
import type { z } from 'zod/v4';
import { toNode } from '../adapter.js';

type ZodCheckDef = z.core.$ZodCheckDef;

const extractCheckDefs = (schema: z.ZodType): ReadonlyArray<ZodCheckDef> =>
  ((schema.def.checks ?? []) as ReadonlyArray<z.core.$ZodCheck>).map((c) => c._zod.def);

const findCheck = <T extends ZodCheckDef>(checks: ReadonlyArray<ZodCheckDef>, name: string): T | undefined =>
  checks.find((c) => c.check === name) as T | undefined;

const pickRandom = <T>(faker: Faker, items: ReadonlyArray<T>): T =>
  items[faker.number.int({ min: 0, max: items.length - 1 })] as T;

const invalidateString = (schema: z.ZodType, faker: Faker): unknown => {
  const checks = extractCheckDefs(schema);
  const hasMin = checks.some((c) => c.check === 'min_length');
  const hasMax = checks.some((c) => c.check === 'max_length');
  const hasFormat = checks.some((c) => c.check === 'string_format');

  const strategies: ReadonlyArray<() => unknown> = [
    () => faker.number.int(),
    ...(hasMin ? [() => ''] : []),
    ...(hasMax ? [() => faker.string.alpha(1000)] : []),
    ...(hasFormat ? [() => `not-a-valid-format-${faker.string.alpha(5)}`] : []),
  ];
  return pickRandom(faker, strategies)();
};

const invalidateNumber = (schema: z.ZodType, faker: Faker): unknown => {
  const checks = extractCheckDefs(schema);
  const gtCheck = findCheck<z.core.$ZodCheckGreaterThanDef>(checks, 'greater_than');
  const ltCheck = findCheck<z.core.$ZodCheckLessThanDef>(checks, 'less_than');
  const hasFormat = checks.some((c) => c.check === 'number_format');

  const strategies: ReadonlyArray<() => unknown> = [
    () => faker.string.alpha(5),
    ...(gtCheck ? [() => Number(gtCheck.value) - 1000] : []),
    ...(ltCheck ? [() => Number(ltCheck.value) + 1000] : []),
    ...(hasFormat ? [() => faker.number.float({ min: 0.01, max: 0.99, fractionDigits: 2 })] : []),
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

  // Generate a valid object via gen-core, then corrupt one random field
  const node = toNode(schema);
  const valid = resolve(node, config, [], 0, faker) as Record<string, unknown>;
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
  const checks = extractCheckDefs(schema);
  const hasMin = checks.some((c) => c.check === 'min_length');
  const hasMax = checks.some((c) => c.check === 'max_length');
  if (hasMin) return [];
  if (hasMax) {
    const maxCheck = findCheck<z.core.$ZodCheckMaxLengthDef>(checks, 'max_length');
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
