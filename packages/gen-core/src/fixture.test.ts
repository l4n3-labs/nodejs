import { describe, expect, it } from 'vitest';
import { fixture } from './fixture.js';
import type {
  ArrayNode,
  BigIntNode,
  BooleanNode,
  DateNode,
  DefaultNode,
  EnumNode,
  IntersectionNode,
  LazyNode,
  LiteralNode,
  MapNode,
  NullableNode,
  NullNode,
  NumberNode,
  ObjectNode,
  OptionalNode,
  PipeNode,
  PromiseNode,
  ReadonlyNode,
  RecordNode,
  SchemaNode,
  SetNode,
  StringNode,
  TemplateLiteralNode,
  TupleNode,
  UnionNode,
} from './schema.js';

// --- Helpers ---

const stringNode = (constraints: StringNode['constraints'] = {}): StringNode => ({ type: 'string', constraints });
const numberNode = (constraints: NumberNode['constraints'] = {}): NumberNode => ({ type: 'number', constraints });
const booleanNode: BooleanNode = { type: 'boolean' };
const nullNode: NullNode = { type: 'null' };

const objectNode = (shape: Record<string, SchemaNode>): ObjectNode => ({ type: 'object', shape });
const arrayNode = (element: SchemaNode, constraints: ArrayNode['constraints'] = {}): ArrayNode => ({
  type: 'array',
  element,
  constraints,
});

// --- Tests ---

describe('gen-core fixture', () => {
  describe('primitives', () => {
    it('generates strings', () => {
      const result = fixture<string>(stringNode(), { seed: 42 }).one();
      expect(typeof result).toBe('string');
    });

    it('generates strings with length constraints', () => {
      const node = stringNode({ minLength: 5, maxLength: 10 });
      const result = fixture<string>(node, { seed: 42 }).one();
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('generates strings with exact length', () => {
      const node = stringNode({ exactLength: 8 });
      const result = fixture<string>(node, { seed: 42 }).one();
      expect(result.length).toBe(8);
    });

    it('generates email format strings', () => {
      const node = stringNode({ format: 'email' });
      const result = fixture<string>(node, { seed: 42 }).one();
      expect(result).toContain('@');
    });

    it('generates uuid format strings', () => {
      const node = stringNode({ format: 'uuid' });
      const result = fixture<string>(node, { seed: 42 }).one();
      expect(result).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('generates strings with startsWith/endsWith', () => {
      const node = stringNode({ startsWith: 'hello-', endsWith: '-world', minLength: 15 });
      const result = fixture<string>(node, { seed: 42 }).one();
      expect(result.startsWith('hello-')).toBe(true);
      expect(result.endsWith('-world')).toBe(true);
    });

    it('generates numbers', () => {
      const result = fixture<number>(numberNode(), { seed: 42 }).one();
      expect(typeof result).toBe('number');
    });

    it('generates integers', () => {
      const node = numberNode({ integer: true, minimum: 0, maximum: 100 });
      const result = fixture<number>(node, { seed: 42 }).one();
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('generates numbers with multipleOf', () => {
      const node = numberNode({ minimum: 0, maximum: 100, multipleOf: 5 });
      const result = fixture<number>(node, { seed: 42 }).one();
      expect(result % 5).toBe(0);
    });

    it('generates booleans', () => {
      const result = fixture<boolean>(booleanNode, { seed: 42 }).one();
      expect(typeof result).toBe('boolean');
    });

    it('generates null', () => {
      expect(fixture(nullNode, { seed: 42 }).one()).toBeNull();
    });

    it('generates undefined', () => {
      expect(fixture({ type: 'undefined' } as const, { seed: 42 }).one()).toBeUndefined();
    });

    it('generates NaN', () => {
      expect(fixture({ type: 'nan' } as const, { seed: 42 }).one()).toBeNaN();
    });

    it('generates symbols', () => {
      expect(typeof fixture({ type: 'symbol' } as const, { seed: 42 }).one()).toBe('symbol');
    });

    it('generates bigints', () => {
      const node: BigIntNode = { type: 'bigint', constraints: { minimum: 0, maximum: 100 } };
      const result = fixture<bigint>(node, { seed: 42 }).one();
      expect(typeof result).toBe('bigint');
      expect(result).toBeGreaterThanOrEqual(0n);
      expect(result).toBeLessThanOrEqual(100n);
    });

    it('generates dates', () => {
      const node: DateNode = { type: 'date', constraints: {} };
      const result = fixture<Date>(node, { seed: 42 }).one();
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('objects', () => {
    it('generates objects with shape', () => {
      const node = objectNode({
        name: stringNode(),
        age: numberNode({ integer: true, minimum: 0 }),
        active: booleanNode,
      });
      const result = fixture<Record<string, unknown>>(node, { seed: 42 }).one();
      expect(typeof result.name).toBe('string');
      expect(typeof result.age).toBe('number');
      expect(typeof result.active).toBe('boolean');
    });

    it('applies derivations', () => {
      const node = objectNode({
        firstName: stringNode(),
        lastName: stringNode(),
        fullName: stringNode(),
      });
      const gen = fixture<{ firstName: string; lastName: string; fullName: string }>(node, { seed: 42 }).derive(
        'fullName',
        (obj) => `${obj.firstName} ${obj.lastName}`,
      );
      const result = gen.one();
      expect(result.fullName).toBe(`${result.firstName} ${result.lastName}`);
    });
  });

  describe('arrays', () => {
    it('generates arrays', () => {
      const node = arrayNode(stringNode());
      const result = fixture<string[]>(node, { seed: 42 }).one();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('respects size constraints', () => {
      const node = arrayNode(numberNode(), { exactSize: 5 });
      const result = fixture<number[]>(node, { seed: 42 }).one();
      expect(result.length).toBe(5);
    });

    it('respects depth limits', () => {
      const node = arrayNode(arrayNode(stringNode()));
      const result = fixture<string[][]>(node, { seed: 42, maxDepth: 1 }).one();
      for (const inner of result) {
        expect(inner.length).toBe(0);
      }
    });
  });

  describe('unions and enums', () => {
    it('generates union values', () => {
      const node: UnionNode = { type: 'union', options: [stringNode(), numberNode()] };
      const result = fixture(node, { seed: 42 }).one();
      expect(typeof result === 'string' || typeof result === 'number').toBe(true);
    });

    it('generates literals', () => {
      const node: LiteralNode = { type: 'literal', values: ['hello'] };
      expect(fixture(node, { seed: 42 }).one()).toBe('hello');
    });

    it('generates enums', () => {
      const node: EnumNode = { type: 'enum', values: ['red', 'green', 'blue'] };
      const result = fixture(node, { seed: 42 }).one();
      expect(['red', 'green', 'blue']).toContain(result);
    });
  });

  describe('wrappers', () => {
    it('generates nullable (sometimes null)', () => {
      const node: NullableNode = { type: 'nullable', inner: stringNode() };
      const results = fixture(node, { seed: 42 }).many(100);
      const nullCount = results.filter((r) => r === null).length;
      expect(nullCount).toBeGreaterThan(0);
      expect(nullCount).toBeLessThan(100);
    });

    it('generates optional (sometimes undefined)', () => {
      const node: OptionalNode = { type: 'optional', inner: stringNode() };
      const results = fixture(node, { seed: 42 }).many(100);
      const undefCount = results.filter((r) => r === undefined).length;
      expect(undefCount).toBeGreaterThan(0);
      expect(undefCount).toBeLessThan(100);
    });

    it('generates default values', () => {
      const node: DefaultNode = { type: 'default', inner: stringNode(), value: 'hello' };
      expect(fixture(node, { seed: 42 }).one()).toBe('hello');
    });

    it('generates readonly values', () => {
      const inner = objectNode({ x: numberNode() });
      const node: ReadonlyNode = { type: 'readonly', inner };
      const result = fixture(node, { seed: 42 }).one() as Record<string, unknown>;
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe('collections', () => {
    it('generates tuples', () => {
      const node: TupleNode = { type: 'tuple', items: [stringNode(), numberNode()], rest: null };
      const result = fixture(node, { seed: 42 }).one() as unknown[];
      expect(result.length).toBe(2);
      expect(typeof result[0]).toBe('string');
      expect(typeof result[1]).toBe('number');
    });

    it('generates sets', () => {
      const node: SetNode = { type: 'set', element: numberNode(), constraints: { minSize: 2, maxSize: 5 } };
      const result = fixture(node, { seed: 42 }).one() as Set<number>;
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBeGreaterThanOrEqual(2);
    });

    it('generates maps', () => {
      const node: MapNode = {
        type: 'map',
        key: stringNode(),
        value: numberNode(),
        constraints: { minSize: 1, maxSize: 3 },
      };
      const result = fixture(node, { seed: 42 }).one() as Map<string, number>;
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBeGreaterThanOrEqual(1);
    });

    it('generates records', () => {
      const node: RecordNode = { type: 'record', key: stringNode(), value: numberNode() };
      const result = fixture(node, { seed: 42 }).one() as Record<string, number>;
      expect(typeof result).toBe('object');
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('composition', () => {
    it('generates intersections', () => {
      const node: IntersectionNode = {
        type: 'intersection',
        left: objectNode({ a: stringNode() }),
        right: objectNode({ b: numberNode() }),
      };
      const result = fixture(node, { seed: 42 }).one() as Record<string, unknown>;
      expect(typeof result.a).toBe('string');
      expect(typeof result.b).toBe('number');
    });

    it('generates lazy (recursive) schemas', () => {
      const node: LazyNode = { type: 'lazy', resolve: () => stringNode() };
      const result = fixture(node, { seed: 42 }).one();
      expect(typeof result).toBe('string');
    });

    it('generates pipe (input schema)', () => {
      const node: PipeNode = { type: 'pipe', input: numberNode() };
      const result = fixture(node, { seed: 42 }).one();
      expect(typeof result).toBe('number');
    });

    it('generates promises', async () => {
      const node: PromiseNode = { type: 'promise', inner: stringNode() };
      const result = fixture(node, { seed: 42 }).one() as Promise<string>;
      expect(result).toBeInstanceOf(Promise);
      expect(typeof (await result)).toBe('string');
    });

    it('generates template literals', () => {
      const node: TemplateLiteralNode = {
        type: 'template_literal',
        parts: ['user-', { type: 'number', constraints: { integer: true, minimum: 1, maximum: 999 } }],
      };
      const result = fixture(node, { seed: 42 }).one() as string;
      expect(result).toMatch(/^user-\d+$/);
    });
  });

  describe('builder API', () => {
    it('seed produces deterministic output', () => {
      const node = objectNode({ name: stringNode(), age: numberNode() });
      const a = fixture(node).seed(42).one();
      const b = fixture(node).seed(42).one();
      expect(a).toEqual(b);
    });

    it('many generates multiple items', () => {
      const node = stringNode();
      const results = fixture(node, { seed: 42 }).many(10);
      expect(results.length).toBe(10);
    });

    it('overrides work with string keys', () => {
      const node = objectNode({ email: stringNode() });
      const gen = fixture<{ email: string }>(node, { seed: 42 }).override('email', () => 'test@example.com');
      expect(gen.one().email).toBe('test@example.com');
    });

    it('overrides work with predicates', () => {
      const node = objectNode({ name: stringNode(), title: stringNode() });
      const gen = fixture<{ name: string; title: string }>(node, { seed: 42 }).override(
        (ctx) => ctx.path.at(-1) === 'title',
        () => 'Mr.',
      );
      const result = gen.one();
      expect(result.title).toBe('Mr.');
      expect(result.name).not.toBe('Mr.');
    });

    it('traits work', () => {
      const node = objectNode({ role: stringNode(), active: booleanNode });
      const gen = fixture<{ role: string; active: boolean }>(node, { seed: 42 })
        .trait('admin', { role: () => 'admin' })
        .with('admin');
      expect(gen.one().role).toBe('admin');
    });

    it('maxDepth is configurable', () => {
      const node = objectNode({ nested: objectNode({ deep: arrayNode(stringNode()) }) });
      const result = fixture(node, { seed: 42 }).maxDepth(2).one() as {
        nested: { deep: string[] };
      };
      expect(result.nested.deep.length).toBe(0);
    });

    it('custom generators can be registered', () => {
      const node = stringNode();
      const gen = fixture<string>(node, { seed: 42 }).generator('string', () => 'custom');
      expect(gen.one()).toBe('custom');
    });
  });

  describe('batch generation', () => {
    it('many with unique keys', () => {
      const node = objectNode({
        id: numberNode({ integer: true, minimum: 1, maximum: 1000 }),
        name: stringNode(),
      });
      const results = fixture<{ id: number; name: string }>(node, { seed: 42 }).many(10, { unique: ['id'] });
      const ids = results.map((r) => r.id);
      expect(new Set(ids).size).toBe(10);
    });
  });
});
