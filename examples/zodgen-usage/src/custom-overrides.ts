import { fixture, override, withSeed } from '@l4n3/zodgen';
import { z } from 'zod';

// Overrides let you customize how specific fields are generated.
// Use fixture.create() to build a generator with overrides.

const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

// String matcher — matches fields by path segment name

const gen = fixture.create(
  override('email', () => 'test@example.com'),
  override('role', () => 'admin' as const),
);

const user = gen.one(userSchema);
console.log('overridden user:', user);
console.log('email is test@example.com?', user.email === 'test@example.com');
console.log('role is admin?', user.role === 'admin');

// Predicate matcher — match based on schema context

const emailOverrideGen = fixture.create(
  override(
    (ctx) => {
      const formatCheck = ctx.checks.find('string_format');
      return formatCheck !== undefined && 'format' in formatCheck && formatCheck.format === 'email';
    },
    () => 'predicate@test.com',
  ),
);

const user2 = emailOverrideGen.one(userSchema);
console.log('predicate override email:', user2.email);

// Combining overrides with seeding

const deterministicGen = fixture.create(
  withSeed(42),
  override('id', () => '00000000-0000-0000-0000-000000000001'),
);

const user3 = deterministicGen.one(userSchema);
console.log('seeded + overridden:', user3);

// Overrides work with nested schemas too

const teamSchema = z.object({
  name: z.string(),
  lead: userSchema,
  members: z.array(userSchema).min(2).max(4),
});

const teamGen = fixture.create(override('email', (ctx) => `user-${ctx.path.join('.')}@test.com`));

const team = teamGen.one(teamSchema);
console.log('team:', JSON.stringify(team, null, 2));
