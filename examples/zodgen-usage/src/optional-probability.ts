import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// Control how often optional fields are present and nullable fields are null.
// Default: optionalRate 0.8 (80% present), nullRate 0.2 (20% null).

const userSchema = z.object({
  name: z.string(),
  email: z.email(),
  bio: z.string().optional(),
  phone: z.string().nullable(),
  avatar: z.url().optional(),
});

// Snapshot-friendly: all optionals present, no nulls

const snapshotGen = fixture(userSchema, { seed: 42 }).optionalRate(1.0).nullRate(0.0);

const snapshotUser = snapshotGen.one();
console.log('Snapshot mode (all fields present):');
console.log('  bio defined?', snapshotUser.bio !== undefined);
console.log('  phone null?', snapshotUser.phone === null);
console.log('  avatar defined?', snapshotUser.avatar !== undefined);

// Sparse data: most optionals missing

const sparseGen = fixture(userSchema, { seed: 42 }).optionalRate(0.1).nullRate(0.9);

const sparseUsers = sparseGen.many(5);
console.log('\nSparse mode (most fields missing/null):');
for (const user of sparseUsers) {
  console.log(`  ${user.name}: bio=${user.bio ?? '(missing)'}, phone=${user.phone ?? '(null)'}`);
}

// Via FixtureOptions

const configuredGen = fixture(userSchema, { seed: 42, optionalRate: 0.5, nullRate: 0.5 });
const mixed = configuredGen.many(10);
const bioCount = mixed.filter((u) => u.bio !== undefined).length;
const phoneNullCount = mixed.filter((u) => u.phone === null).length;
console.log(`\nMixed mode: ${bioCount}/10 have bio, ${phoneNullCount}/10 have null phone`);
