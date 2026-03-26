import type { SchemaNode } from '@l4n3/gen-core';
import type { JsonSchema } from './types.js';

type RefResolver = (ref: string) => SchemaNode;

const buildRefResolver = (rootSchema: JsonSchema): RefResolver => {
  const defs = rootSchema.$defs ?? rootSchema.definitions ?? {};

  return (ref: string): SchemaNode => {
    // Only support local $defs references: #/$defs/Name or #/definitions/Name
    const match = ref.match(/^#\/(?:\$defs|definitions)\/(.+)$/);
    if (!match?.[1]) throw new Error(`Unsupported $ref: ${ref}. Only #/$defs/ and #/definitions/ are supported.`);

    const defName = match[1];
    const defSchema = defs[defName];
    if (!defSchema) throw new Error(`$ref target not found: ${ref}`);

    // Use lazy resolution to handle circular references
    return toNodeWithResolver(defSchema, buildRefResolver(rootSchema));
  };
};

const normalizeTypes = (schema: JsonSchema): ReadonlyArray<string> => {
  if (schema.type === undefined) return [];
  return typeof schema.type === 'string' ? [schema.type] : schema.type;
};

const isNullable = (schema: JsonSchema): boolean => {
  const types = normalizeTypes(schema);
  return types.includes('null') || schema.nullable === true;
};

const primaryType = (schema: JsonSchema): string | undefined => {
  const types = normalizeTypes(schema);
  return types.find((t) => t !== 'null');
};

const toNodeWithResolver = (schema: JsonSchema, resolveRef: RefResolver): SchemaNode => {
  // $ref — lazy resolution for circular reference safety
  if (schema.$ref) {
    return { type: 'lazy', resolve: () => resolveRef(schema.$ref as string) };
  }

  // Composition keywords
  if (schema.oneOf) {
    return { type: 'union', options: schema.oneOf.map((s) => toNodeWithResolver(s, resolveRef)) };
  }

  if (schema.anyOf) {
    return { type: 'union', options: schema.anyOf.map((s) => toNodeWithResolver(s, resolveRef)) };
  }

  if (schema.allOf) {
    return schema.allOf.reduce<SchemaNode>(
      (acc, s) => ({
        type: 'intersection',
        left: acc,
        right: toNodeWithResolver(s, resolveRef),
      }),
      // Start with an empty object so intersection merging works
      { type: 'object', shape: {} },
    );
  }

  // const — single literal value
  if (schema.const !== undefined) {
    return { type: 'literal', values: [schema.const] };
  }

  // enum — multiple literal values
  if (schema.enum) {
    return { type: 'literal', values: [...schema.enum] };
  }

  const type = primaryType(schema);
  const nullable = isNullable(schema);

  const wrapNullable = (node: SchemaNode): SchemaNode => (nullable ? { type: 'nullable', inner: node } : node);

  switch (type) {
    case 'string':
      return wrapNullable({
        type: 'string',
        constraints: {
          ...(schema.minLength !== undefined ? { minLength: schema.minLength } : {}),
          ...(schema.maxLength !== undefined ? { maxLength: schema.maxLength } : {}),
          ...(schema.format ? { format: schema.format } : {}),
          ...(schema.pattern ? { pattern: schema.pattern } : {}),
        },
      });

    case 'number':
    case 'integer':
      return wrapNullable({
        type: 'number',
        constraints: {
          ...(type === 'integer' ? { integer: true } : {}),
          ...(schema.minimum !== undefined ? { minimum: schema.minimum } : {}),
          ...(schema.maximum !== undefined ? { maximum: schema.maximum } : {}),
          ...(schema.exclusiveMinimum !== undefined
            ? typeof schema.exclusiveMinimum === 'number'
              ? { minimum: schema.exclusiveMinimum, exclusiveMinimum: true }
              : { exclusiveMinimum: true }
            : {}),
          ...(schema.exclusiveMaximum !== undefined
            ? typeof schema.exclusiveMaximum === 'number'
              ? { maximum: schema.exclusiveMaximum, exclusiveMaximum: true }
              : { exclusiveMaximum: true }
            : {}),
          ...(schema.multipleOf !== undefined ? { multipleOf: schema.multipleOf } : {}),
        },
      });

    case 'boolean':
      return wrapNullable({ type: 'boolean' });

    case 'null':
      return { type: 'null' };

    case 'object': {
      const shape: Record<string, SchemaNode> = {};
      const required = new Set(schema.required ?? []);

      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const propNode = toNodeWithResolver(propSchema, resolveRef);
          shape[key] = required.has(key) ? propNode : { type: 'optional', inner: propNode };
        }
      }

      return wrapNullable({ type: 'object', shape });
    }

    case 'array': {
      // Tuple form: prefixItems
      if (schema.prefixItems) {
        return wrapNullable({
          type: 'tuple',
          items: schema.prefixItems.map((s) => toNodeWithResolver(s, resolveRef)),
          rest: schema.items ? toNodeWithResolver(schema.items, resolveRef) : null,
        });
      }

      const element: SchemaNode = schema.items ? toNodeWithResolver(schema.items, resolveRef) : { type: 'unknown' };

      return wrapNullable({
        type: 'array',
        element,
        constraints: {
          ...(schema.minItems !== undefined ? { minSize: schema.minItems } : {}),
          ...(schema.maxItems !== undefined ? { maxSize: schema.maxItems } : {}),
        },
      });
    }

    default:
      // No type specified — treat as unknown
      if (schema.properties) {
        // Has properties but no type — treat as object
        return toNodeWithResolver({ ...schema, type: 'object' }, resolveRef);
      }
      return { type: 'unknown' };
  }
};

export const toNode = (schema: JsonSchema): SchemaNode => {
  const resolveRef = buildRefResolver(schema);
  return toNodeWithResolver(schema, resolveRef);
};
