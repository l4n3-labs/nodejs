import type {
  BigIntConstraints,
  DateConstraints,
  NumberConstraints,
  SchemaNode,
  SizeConstraints,
  StringConstraints,
} from '@l4n3/gen-core';
import type { z } from 'zod/v4';

type ZodCheckDef = z.core.$ZodCheckDef;

const extractCheckDefs = (schema: z.ZodType): ReadonlyArray<ZodCheckDef> =>
  ((schema.def.checks ?? []) as ReadonlyArray<z.core.$ZodCheck>).map((c) => c._zod.def);

const findCheck = <T extends ZodCheckDef>(checks: ReadonlyArray<ZodCheckDef>, name: string): T | undefined =>
  checks.find((c) => c.check === name) as T | undefined;

const extractStringConstraints = (schema: z.ZodType): StringConstraints => {
  const checks = extractCheckDefs(schema);
  const formatChecks = checks.filter((c): c is z.core.$ZodCheckStringFormatDef => c.check === 'string_format');

  // Zod v4: shorthand schemas like z.email() put format directly on the def
  const def = schema._zod.def as z.core.$ZodStringDef & { check?: string; format?: string };
  if (def.check === 'string_format' && def.format) {
    formatChecks.push(def as unknown as z.core.$ZodCheckStringFormatDef);
  }

  const prefix = (formatChecks.find((f) => f.format === 'starts_with') as z.core.$ZodCheckStartsWithDef | undefined)
    ?.prefix;
  const suffix = (formatChecks.find((f) => f.format === 'ends_with') as z.core.$ZodCheckEndsWithDef | undefined)
    ?.suffix;
  const includes = (formatChecks.find((f) => f.format === 'includes') as z.core.$ZodCheckIncludesDef | undefined)
    ?.includes;

  const wellKnown = formatChecks.find(
    (f) => f.format !== 'starts_with' && f.format !== 'ends_with' && f.format !== 'includes',
  );

  const minCheck = findCheck<z.core.$ZodCheckMinLengthDef>(checks, 'min_length');
  const maxCheck = findCheck<z.core.$ZodCheckMaxLengthDef>(checks, 'max_length');
  const exactCheck = findCheck<z.core.$ZodCheckLengthEqualsDef>(checks, 'length_equals');

  return {
    ...(wellKnown ? { format: wellKnown.format } : {}),
    ...(prefix ? { startsWith: prefix } : {}),
    ...(suffix ? { endsWith: suffix } : {}),
    ...(includes ? { includes } : {}),
    ...(minCheck ? { minLength: minCheck.minimum } : {}),
    ...(maxCheck ? { maxLength: maxCheck.maximum } : {}),
    ...(exactCheck ? { exactLength: exactCheck.length } : {}),
  };
};

const extractNumberConstraints = (schema: z.ZodType): NumberConstraints => {
  const checks = extractCheckDefs(schema);
  const gtCheck = findCheck<z.core.$ZodCheckGreaterThanDef>(checks, 'greater_than');
  const ltCheck = findCheck<z.core.$ZodCheckLessThanDef>(checks, 'less_than');
  const formatCheck = findCheck<z.core.$ZodCheckNumberFormatDef>(checks, 'number_format');
  const multipleOfCheck = findCheck<z.core.$ZodCheckMultipleOfDef>(checks, 'multiple_of');

  const fmt = formatCheck?.format;
  const isInt = fmt === 'safeint' || fmt === 'int32' || fmt === 'uint32';

  return {
    ...(gtCheck ? { minimum: Number(gtCheck.value), exclusiveMinimum: !gtCheck.inclusive } : {}),
    ...(ltCheck ? { maximum: Number(ltCheck.value), exclusiveMaximum: !ltCheck.inclusive } : {}),
    ...(multipleOfCheck ? { multipleOf: Number(multipleOfCheck.value) } : {}),
    ...(isInt ? { integer: true } : {}),
  };
};

const extractBigIntConstraints = (schema: z.ZodType): BigIntConstraints => {
  const checks = extractCheckDefs(schema);
  const gtCheck = findCheck<z.core.$ZodCheckGreaterThanDef>(checks, 'greater_than');
  const ltCheck = findCheck<z.core.$ZodCheckLessThanDef>(checks, 'less_than');

  return {
    ...(gtCheck ? { minimum: Number(gtCheck.value), exclusiveMinimum: !gtCheck.inclusive } : {}),
    ...(ltCheck ? { maximum: Number(ltCheck.value), exclusiveMaximum: !ltCheck.inclusive } : {}),
  };
};

const extractDateConstraints = (schema: z.ZodType): DateConstraints => {
  const checks = extractCheckDefs(schema);
  const gtCheck = findCheck<z.core.$ZodCheckGreaterThanDef>(checks, 'greater_than');
  const ltCheck = findCheck<z.core.$ZodCheckLessThanDef>(checks, 'less_than');

  return {
    ...(gtCheck ? { minimum: Number(gtCheck.value), exclusiveMinimum: !gtCheck.inclusive } : {}),
    ...(ltCheck ? { maximum: Number(ltCheck.value), exclusiveMaximum: !ltCheck.inclusive } : {}),
  };
};

const extractSizeConstraints = (schema: z.ZodType): SizeConstraints => {
  const checks = extractCheckDefs(schema);
  const minCheck =
    findCheck<z.core.$ZodCheckMinSizeDef>(checks, 'min_size') ??
    findCheck<z.core.$ZodCheckMinLengthDef>(checks, 'min_length');
  const maxCheck =
    findCheck<z.core.$ZodCheckMaxSizeDef>(checks, 'max_size') ??
    findCheck<z.core.$ZodCheckMaxLengthDef>(checks, 'max_length');
  const exactCheck =
    findCheck<z.core.$ZodCheckSizeEqualsDef>(checks, 'size_equals') ??
    findCheck<z.core.$ZodCheckLengthEqualsDef>(checks, 'length_equals');

  const exactSize = exactCheck ? ('size' in exactCheck ? exactCheck.size : exactCheck.length) : undefined;

  return {
    ...(minCheck ? { minSize: minCheck.minimum } : {}),
    ...(maxCheck ? { maxSize: maxCheck.maximum } : {}),
    ...(exactSize !== undefined ? { exactSize } : {}),
  };
};

// biome-ignore lint/suspicious/noExplicitAny: Zod v4 internals require bypassing the public type surface
const getDef = (schema: z.ZodType): any => (schema as any)._zod.def;

/**
 * Converts a Zod schema to a {@link SchemaNode}, the internal representation
 * used by the generation engine. Recursively walks the Zod schema tree,
 * extracting constraints and structure.
 *
 * @param schema - Any Zod schema type (primitives, objects, arrays, unions, etc.).
 * @returns The equivalent `SchemaNode` tree.
 * @throws If the schema contains an unsupported Zod type.
 */
export const toNode = (schema: z.ZodType): SchemaNode => {
  const def = getDef(schema);
  const type: string = def.type;

  switch (type) {
    case 'string':
      return { type: 'string', constraints: extractStringConstraints(schema) };
    case 'number':
      return { type: 'number', constraints: extractNumberConstraints(schema) };
    case 'boolean':
      return { type: 'boolean' };
    case 'bigint':
      return { type: 'bigint', constraints: extractBigIntConstraints(schema) };
    case 'date':
      return { type: 'date', constraints: extractDateConstraints(schema) };
    case 'symbol':
      return { type: 'symbol' };
    case 'null':
      return { type: 'null' };
    case 'undefined':
      return { type: 'undefined' };
    case 'void':
      return { type: 'void' };
    case 'never':
      return { type: 'never' };
    case 'unknown':
      return { type: 'unknown' };
    case 'any':
      return { type: 'any' };
    case 'nan':
      return { type: 'nan' };
    case 'custom':
      return { type: 'custom' };

    case 'object':
      return {
        type: 'object',
        shape: Object.fromEntries(
          Object.entries(def.shape as Record<string, z.ZodType>).map(([k, v]) => [k, toNode(v)]),
        ),
      };

    case 'array':
      return {
        type: 'array',
        element: toNode(def.element as z.ZodType),
        constraints: extractSizeConstraints(schema),
      };

    case 'tuple':
      return {
        type: 'tuple',
        items: (def.items as z.ZodType[]).map(toNode),
        rest: def.rest === null ? null : toNode(def.rest as z.ZodType),
      };

    case 'set':
      return {
        type: 'set',
        element: toNode(def.valueType as z.ZodType),
        constraints: extractSizeConstraints(schema),
      };

    case 'map':
      return {
        type: 'map',
        key: toNode(def.keyType as z.ZodType),
        value: toNode(def.valueType as z.ZodType),
        constraints: extractSizeConstraints(schema),
      };

    case 'record':
      return {
        type: 'record',
        key: toNode(def.keyType as z.ZodType),
        value: toNode(def.valueType as z.ZodType),
      };

    case 'literal':
      return { type: 'literal', values: def.values as unknown[] };

    case 'enum':
      return { type: 'enum', values: Object.values(def.entries as Record<string, string>) };

    case 'union':
      return { type: 'union', options: (def.options as z.ZodType[]).map(toNode) };

    case 'intersection':
      return {
        type: 'intersection',
        left: toNode(def.left as z.ZodType),
        right: toNode(def.right as z.ZodType),
      };

    case 'nullable':
      return { type: 'nullable', inner: toNode(def.innerType as z.ZodType) };

    case 'optional':
      return { type: 'optional', inner: toNode(def.innerType as z.ZodType) };

    case 'default':
      return { type: 'default', inner: toNode(def.innerType as z.ZodType), value: def.defaultValue };

    case 'readonly':
      return { type: 'readonly', inner: toNode(def.innerType as z.ZodType) };

    case 'catch':
      return { type: 'catch', inner: toNode(def.innerType as z.ZodType) };

    case 'lazy':
      return { type: 'lazy', resolve: () => toNode(def.getter() as z.ZodType) };

    case 'promise':
      return { type: 'promise', inner: toNode(def.innerType as z.ZodType) };

    case 'pipe':
      return { type: 'pipe', input: toNode(def.in as z.ZodType) };

    case 'template_literal':
      return {
        type: 'template_literal',
        parts: (def.parts as (string | z.ZodType)[]).map((p) => (typeof p === 'string' ? p : toNode(p))),
      };

    default:
      throw new Error(`Unsupported Zod schema type: ${type}`);
  }
};
