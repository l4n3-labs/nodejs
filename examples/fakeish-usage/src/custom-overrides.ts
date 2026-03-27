import { fixture } from '@l4n3/fakeish';
import { z } from 'zod';

// Overrides let you customize how specific fields are generated.
// Use .override() on a fixture generator to customize fields.

const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

// String key override — type-safe, autocompletes from schema keys

const gen = fixture(userSchema)
  .override('email', () => 'test@example.com')
  .override('role', () => 'admin' as const);

const user = gen.one();
console.log('overridden user:', user);
console.log('email is test@example.com?', user.email === 'test@example.com');
console.log('role is admin?', user.role === 'admin');

// Predicate matcher — match based on schema context

const emailOverrideGen = fixture(userSchema).override(
  (ctx) =>
    ctx.node.type === 'string' && (ctx.node as { constraints: { format?: string } }).constraints.format === 'email',
  () => 'predicate@test.com',
);

const user2 = emailOverrideGen.one();
console.log('predicate override email:', user2.email);

// Combining overrides with seeding

const deterministicGen = fixture(userSchema, { seed: 42 }).override('id', () => '00000000-0000-0000-0000-000000000001');

const user3 = deterministicGen.one();
console.log('seeded + overridden:', user3);

// Overrides work with nested schemas too

const teamSchema = z.object({
  name: z.string(),
  lead: userSchema,
  members: z.array(userSchema).min(2).max(4),
});

const teamGen = fixture(teamSchema).override(
  (ctx) => ctx.path.at(-1) === 'email',
  (ctx) => `user-${ctx.path.join('.')}@test.com`,
);

const team = teamGen.one();
console.log('team:', JSON.stringify(team, null, 2));
