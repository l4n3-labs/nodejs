import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// Traits are named, composable override bundles.
// Define with .trait(), activate with .with().

const userSchema = z.object({
  name: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'editor', 'viewer']),
  status: z.enum(['active', 'inactive', 'suspended']),
  plan: z.enum(['free', 'pro', 'enterprise']),
});

// Define a reusable factory with traits

const userFactory = fixture(userSchema, { seed: 42 })
  .trait('admin', {
    role: () => 'admin' as const,
    plan: () => 'enterprise' as const,
  })
  .trait('inactive', {
    status: () => 'inactive' as const,
  })
  .trait('premium', {
    plan: () => 'pro' as const,
  });

// Use traits individually

const admin = userFactory.with('admin').one();
console.log('Admin:', admin.role, admin.plan); // admin, enterprise

// Compose multiple traits

const inactiveAdmin = userFactory.with('admin', 'inactive').one();
console.log('Inactive admin:', inactiveAdmin.role, inactiveAdmin.status); // admin, inactive

// Traits + explicit overrides — explicit overrides take precedence

const customAdmin = userFactory
  .override('name', () => 'Super Admin')
  .with('admin')
  .one();
console.log('Custom admin:', customAdmin.name, customAdmin.role); // Super Admin, admin

// Without .with(), traits have no effect — random generation

const randomUser = userFactory.one();
console.log('Random user:', randomUser.role, randomUser.status, randomUser.plan);

// Batch generation with traits

const premiumUsers = userFactory.with('premium').many(5);
console.log('\nPremium users:');
for (const user of premiumUsers) {
  console.log(`  ${user.name} — ${user.plan} (${user.status})`);
}
