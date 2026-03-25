import { bench, describe } from 'vitest';
import { z } from 'zod/v4';
import { fixture } from './fixture.js';

const SimpleSchema = z.object({
  name: z.string(),
  email: z.email(),
  age: z.number().int().min(18).max(99),
  active: z.boolean(),
});

const NestedSchema = z.object({
  id: z.uuid(),
  name: z.string().max(255),
  email: z.email(),
  role: z.enum(['admin', 'editor', 'viewer']),
  profile: z.object({
    bio: z.string().max(500),
    avatar: z.string().url(),
    settings: z.object({
      theme: z.enum(['light', 'dark']),
      notifications: z.boolean(),
      language: z.string().length(2),
    }),
  }),
  tags: z.array(z.string()).min(1).max(5),
});

const AccountSchema = z.object({
  id: z.uuid(),
  name: z.string().max(255),
  type: z.string().nullable(),
  deleted: z.coerce.date().max(new Date()).nullable(),
  createdAt: z.coerce.date().max(new Date()),
  createdBy: z.email().nullable(),
  updatedAt: z.coerce.date().max(new Date()).nullable(),
  updatedBy: z.email().nullable(),
});

describe('one()', () => {
  bench('simple object', () => {
    fixture(SimpleSchema, { seed: 42 }).one();
  });

  bench('nested object', () => {
    fixture(NestedSchema, { seed: 42 }).one();
  });

  bench('simple object (unseeded)', () => {
    fixture(SimpleSchema).one();
  });
});

describe('many()', () => {
  bench('10 simple objects', () => {
    fixture(SimpleSchema, { seed: 42 }).many(10);
  });

  bench('100 simple objects', () => {
    fixture(SimpleSchema, { seed: 42 }).many(100);
  });

  bench('1000 simple objects', () => {
    fixture(SimpleSchema, { seed: 42 }).many(1000);
  });

  bench('100 nested objects', () => {
    fixture(NestedSchema, { seed: 42 }).many(100);
  });

  bench('100 account objects', () => {
    fixture(AccountSchema, { seed: 42 }).many(100);
  });
});

describe('many() with unique', () => {
  bench('100 with unique id', () => {
    fixture(AccountSchema, { seed: 42 }).many(100, { unique: ['id'] });
  });

  bench('100 with unique nested path', () => {
    fixture(NestedSchema, { seed: 42 }).many(100, { unique: ['profile.avatar'] });
  });
});

describe('overrides', () => {
  bench('1 string override', () => {
    fixture(AccountSchema, { seed: 42 })
      .override('type', () => 'Partner')
      .many(100);
  });

  bench('3 string overrides', () => {
    fixture(AccountSchema, { seed: 42 })
      .override('type', () => 'Partner')
      .override('createdBy', () => 'admin@test.com')
      .override('updatedBy', () => 'admin@test.com')
      .many(100);
  });

  bench('1 predicate override', () => {
    fixture(AccountSchema, { seed: 42 })
      .override(
        (ctx) => ctx.path.at(-1) === 'type',
        () => 'Partner',
      )
      .many(100);
  });

  bench('partialOverride', () => {
    fixture(NestedSchema, { seed: 42 })
      .partialOverride('profile', { bio: () => 'test bio' })
      .many(100);
  });
});

describe('primitives', () => {
  bench('1000 strings', () => {
    fixture(z.string(), { seed: 42 }).many(1000);
  });

  bench('1000 numbers', () => {
    fixture(z.number(), { seed: 42 }).many(1000);
  });

  bench('1000 emails', () => {
    fixture(z.email(), { seed: 42 }).many(1000);
  });

  bench('1000 uuids', () => {
    fixture(z.uuid(), { seed: 42 }).many(1000);
  });
});
