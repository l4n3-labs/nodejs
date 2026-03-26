import { describe, expect, it } from 'vitest';
import { fixture } from './fixture.js';
import { fromOpenAPI } from './openapi.js';
import type { JsonSchema } from './types.js';

describe('JSON Schema fixture generation', () => {
  describe('primitives', () => {
    it('generates strings', () => {
      const result = fixture({ type: 'string' }, { seed: 42 }).one();
      expect(typeof result).toBe('string');
    });

    it('generates strings with minLength/maxLength', () => {
      const result = fixture<string>({ type: 'string', minLength: 5, maxLength: 10 }, { seed: 42 }).one();
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('generates strings with format', () => {
      const result = fixture<string>({ type: 'string', format: 'email' }, { seed: 42 }).one();
      expect(result).toContain('@');
    });

    it('generates strings with uuid format', () => {
      const result = fixture<string>({ type: 'string', format: 'uuid' }, { seed: 42 }).one();
      expect(result).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('generates numbers', () => {
      const result = fixture({ type: 'number' }, { seed: 42 }).one();
      expect(typeof result).toBe('number');
    });

    it('generates numbers with min/max', () => {
      const result = fixture<number>({ type: 'number', minimum: 10, maximum: 20 }, { seed: 42 }).one();
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(20);
    });

    it('generates numbers with exclusiveMinimum/exclusiveMaximum (numeric form)', () => {
      const result = fixture<number>({ type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 10 }, { seed: 42 }).one();
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10);
    });

    it('generates integers', () => {
      const result = fixture<number>({ type: 'integer', minimum: 0, maximum: 100 }, { seed: 42 }).one();
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('generates numbers with multipleOf', () => {
      const result = fixture<number>({ type: 'integer', minimum: 0, maximum: 100, multipleOf: 5 }, { seed: 42 }).one();
      expect(result % 5).toBe(0);
    });

    it('generates booleans', () => {
      const result = fixture({ type: 'boolean' }, { seed: 42 }).one();
      expect(typeof result).toBe('boolean');
    });

    it('generates null', () => {
      expect(fixture({ type: 'null' }, { seed: 42 }).one()).toBeNull();
    });
  });

  describe('objects', () => {
    it('generates objects with properties', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer', minimum: 0 },
        },
        required: ['name', 'age'],
      };
      const result = fixture<{ name: string; age: number }>(schema, { seed: 42 }).one();
      expect(typeof result.name).toBe('string');
      expect(typeof result.age).toBe('number');
      expect(Number.isInteger(result.age)).toBe(true);
    });

    it('wraps non-required properties in optional', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          required_field: { type: 'string' },
          optional_field: { type: 'string' },
        },
        required: ['required_field'],
      };
      const results = fixture(schema, { seed: 42 }).optionalRate(0).many(10);
      for (const r of results) {
        const obj = r as Record<string, unknown>;
        expect(typeof obj.required_field).toBe('string');
        expect(obj.optional_field).toBeUndefined();
      }
    });

    it('infers object type from properties when type is omitted', () => {
      const schema: JsonSchema = {
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };
      const result = fixture(schema, { seed: 42 }).one() as Record<string, unknown>;
      expect(typeof result.name).toBe('string');
    });
  });

  describe('arrays', () => {
    it('generates arrays', () => {
      const schema: JsonSchema = {
        type: 'array',
        items: { type: 'string' },
      };
      const result = fixture(schema, { seed: 42 }).one() as string[];
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('respects minItems/maxItems', () => {
      const schema: JsonSchema = {
        type: 'array',
        items: { type: 'number' },
        minItems: 3,
        maxItems: 5,
      };
      const result = fixture(schema, { seed: 42 }).one() as number[];
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('generates tuples from prefixItems', () => {
      const schema: JsonSchema = {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'number' }],
      };
      const result = fixture(schema, { seed: 42 }).one() as [string, number];
      expect(typeof result[0]).toBe('string');
      expect(typeof result[1]).toBe('number');
    });
  });

  describe('composition', () => {
    it('generates from oneOf', () => {
      const schema: JsonSchema = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      };
      const result = fixture(schema, { seed: 42 }).one();
      expect(typeof result === 'string' || typeof result === 'number').toBe(true);
    });

    it('generates from anyOf', () => {
      const schema: JsonSchema = {
        anyOf: [{ type: 'string' }, { type: 'number' }],
      };
      const result = fixture(schema, { seed: 42 }).one();
      expect(typeof result === 'string' || typeof result === 'number').toBe(true);
    });

    it('generates from allOf (merges objects)', () => {
      const schema: JsonSchema = {
        allOf: [
          { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
          { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
        ],
      };
      const result = fixture(schema, { seed: 42 }).one() as Record<string, unknown>;
      expect(typeof result.a).toBe('string');
      expect(typeof result.b).toBe('number');
    });
  });

  describe('enum and const', () => {
    it('generates from enum', () => {
      const schema: JsonSchema = { enum: ['red', 'green', 'blue'] };
      const result = fixture(schema, { seed: 42 }).one();
      expect(['red', 'green', 'blue']).toContain(result);
    });

    it('generates from const', () => {
      const schema: JsonSchema = { const: 'fixed-value' };
      expect(fixture(schema, { seed: 42 }).one()).toBe('fixed-value');
    });
  });

  describe('nullable', () => {
    it('handles type array with null: ["string", "null"]', () => {
      const schema: JsonSchema = { type: ['string', 'null'] };
      const results = fixture(schema, { seed: 42 }).many(100);
      const nullCount = results.filter((r) => r === null).length;
      const stringCount = results.filter((r) => typeof r === 'string').length;
      expect(nullCount).toBeGreaterThan(0);
      expect(stringCount).toBeGreaterThan(0);
    });

    it('handles OpenAPI 3.0 nullable: true', () => {
      const schema: JsonSchema = { type: 'string', nullable: true };
      const results = fixture(schema, { seed: 42 }).many(100);
      const nullCount = results.filter((r) => r === null).length;
      expect(nullCount).toBeGreaterThan(0);
    });
  });

  describe('$ref resolution', () => {
    it('resolves $defs references', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          address: { $ref: '#/$defs/Address' },
        },
        required: ['address'],
        $defs: {
          Address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
            },
            required: ['street', 'city'],
          },
        },
      };
      const result = fixture(schema, { seed: 42 }).one() as { address: { street: string; city: string } };
      expect(typeof result.address.street).toBe('string');
      expect(typeof result.address.city).toBe('string');
    });

    it('resolves definitions references (legacy)', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          tag: { $ref: '#/definitions/Tag' },
        },
        required: ['tag'],
        definitions: {
          Tag: { type: 'string' },
        },
      };
      const result = fixture(schema, { seed: 42 }).one() as { tag: string };
      expect(typeof result.tag).toBe('string');
    });

    it('handles recursive $ref with depth limiting', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          value: { type: 'string' },
          children: {
            type: 'array',
            items: { $ref: '#/$defs/Tree' },
          },
        },
        required: ['value', 'children'],
        $defs: {
          Tree: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              children: {
                type: 'array',
                items: { $ref: '#/$defs/Tree' },
              },
            },
            required: ['value', 'children'],
          },
        },
      };
      const result = fixture(schema, { seed: 42, maxDepth: 5 }).one() as {
        value: string;
        children: unknown[];
      };
      expect(typeof result.value).toBe('string');
      expect(Array.isArray(result.children)).toBe(true);
    });
  });

  describe('builder API', () => {
    it('seed produces deterministic output', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: { name: { type: 'string' }, age: { type: 'integer' } },
        required: ['name', 'age'],
      };
      const a = fixture(schema).seed(42).one();
      const b = fixture(schema).seed(42).one();
      expect(a).toEqual(b);
    });

    it('many generates multiple items', () => {
      const results = fixture({ type: 'string' }, { seed: 42 }).many(10);
      expect(results.length).toBe(10);
    });

    it('overrides work with string keys', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: { email: { type: 'string', format: 'email' } },
        required: ['email'],
      };
      const result = fixture<{ email: string }>(schema, { seed: 42 })
        .override('email', () => 'test@example.com')
        .one();
      expect(result.email).toBe('test@example.com');
    });

    it('unique constraint works in many()', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, maximum: 10000 },
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      };
      const results = fixture<{ id: number; name: string }>(schema, { seed: 42 }).many(10, { unique: ['id'] });
      const ids = results.map((r) => r.id);
      expect(new Set(ids).size).toBe(10);
    });
  });
});

describe('OpenAPI fixture generation', () => {
  it('extracts schemas from OpenAPI spec', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0' },
      paths: {},
      components: {
        schemas: {
          Pet: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tag: { type: 'string' },
            },
            required: ['name'],
          } satisfies JsonSchema,
        },
      },
    };
    const schemas = fromOpenAPI(spec, { seed: 42 });
    expect(schemas.Pet).toBeDefined();
    const pet = schemas.Pet?.one() as { name: string; tag?: string };
    expect(typeof pet.name).toBe('string');
  });

  it('resolves cross-schema $ref in OpenAPI', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0' },
      paths: {},
      components: {
        schemas: {
          Order: {
            type: 'object',
            properties: {
              item: { $ref: '#/$defs/Product' },
              quantity: { type: 'integer', minimum: 1 },
            },
            required: ['item', 'quantity'],
          } satisfies JsonSchema,
          Product: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: 'number', minimum: 0 },
            },
            required: ['name', 'price'],
          } satisfies JsonSchema,
        },
      },
    };
    const schemas = fromOpenAPI(spec, { seed: 42 });
    const order = schemas.Order?.one() as { item: { name: string; price: number }; quantity: number };
    expect(typeof order.item.name).toBe('string');
    expect(typeof order.item.price).toBe('number');
    expect(Number.isInteger(order.quantity)).toBe(true);
  });

  it('returns empty object when no schemas', () => {
    expect(fromOpenAPI({ openapi: '3.1.0' })).toEqual({});
  });
});
