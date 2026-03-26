import { base, en, faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { resolve } from './resolve.js';
import type { GenContext, GeneratorConfig } from './types.js';

const makeConfig = (overrides: GeneratorConfig['overrides'] = []): GeneratorConfig => ({
  seed: undefined,
  maxDepth: 3,
  locale: [en, base],
  semanticFieldDetection: false,
  optionalRate: 0.8,
  nullRate: 0.2,
  derivations: [],
  traits: {},
  overrides,
  generators: {},
});

describe('resolve', () => {
  it('resolves z.string() to a string', () => {
    const result = resolve(z.string(), makeConfig(), [], 0, faker);
    expect(typeof result).toBe('string');
  });

  it('resolves z.number() to a number', () => {
    const result = resolve(z.number(), makeConfig(), [], 0, faker);
    expect(typeof result).toBe('number');
  });

  it('resolves z.boolean() to a boolean', () => {
    const result = resolve(z.boolean(), makeConfig(), [], 0, faker);
    expect(typeof result).toBe('boolean');
  });

  it('resolves z.object() recursively with all fields generated', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      active: z.boolean(),
    });
    const result = resolve(schema, makeConfig(), [], 0, faker) as Record<string, unknown>;
    expect(typeof result).toBe('object');
    expect(typeof result.name).toBe('string');
    expect(typeof result.age).toBe('number');
    expect(typeof result.active).toBe('boolean');
  });

  it('applies string override matching by path segment', () => {
    const schema = z.object({ name: z.string() });
    const config = makeConfig([
      {
        matcher: 'name',
        generate: () => 'overridden-name',
      },
    ]);
    const result = resolve(schema, config, [], 0, faker) as Record<string, unknown>;
    expect(result.name).toBe('overridden-name');
  });

  it('applies predicate override', () => {
    const config = makeConfig([
      {
        matcher: (ctx: GenContext<unknown>) => ctx.path.at(-1) === 'email',
        generate: () => 'test@example.com',
      },
    ]);
    const schema = z.object({ email: z.string() });
    const result = resolve(schema, config, [], 0, faker) as Record<string, unknown>;
    expect(result.email).toBe('test@example.com');
  });

  it('first registered override wins when multiple match', () => {
    const config = makeConfig([
      {
        matcher: 'name',
        generate: () => 'first',
      },
      {
        matcher: 'name',
        generate: () => 'second',
      },
    ]);
    const schema = z.object({ name: z.string() });
    const result = resolve(schema, config, [], 0, faker) as Record<string, unknown>;
    expect(result.name).toBe('first');
  });

  it('throws for unknown def type', () => {
    const fakeDef = { type: '__nonexistent_type__', checks: [] };
    const fakeSchema = {
      def: fakeDef,
      _zod: { def: fakeDef },
    } as unknown as z.ZodType;
    expect(() => resolve(fakeSchema, makeConfig(), [], 0, faker)).toThrow(
      'No generator for type: __nonexistent_type__',
    );
  });

  it('handles nested schemas: object with array of objects', () => {
    const schema = z.object({
      users: z.array(
        z.object({
          id: z.number(),
          username: z.string(),
        }),
      ),
    });
    const result = resolve(schema, makeConfig(), [], 0, faker) as Record<string, unknown>;
    expect(Array.isArray(result.users)).toBe(true);
    const users = result.users as Array<Record<string, unknown>>;
    expect(users.length).toBeGreaterThanOrEqual(1);
    for (const user of users) {
      expect(typeof user.id).toBe('number');
      expect(typeof user.username).toBe('string');
    }
  });

  it('passes path correctly for nested object keys', () => {
    const capturedPaths: Array<ReadonlyArray<string>> = [];
    const config = makeConfig([
      {
        matcher: (ctx: GenContext<unknown>) => {
          capturedPaths.push(ctx.path);
          return false;
        },
        generate: () => null,
      },
    ]);
    const schema = z.object({ foo: z.string() });
    resolve(schema, config, [], 0, faker);
    expect(capturedPaths).toContainEqual(['foo']);
  });
});
