import { fixture, withSeed } from '@l4n3/zodgen';
import { z } from 'zod';

// Seeded generation produces deterministic output.
// The same seed always generates the same data.

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(18).max(99),
});

// Using the seed option

const a = fixture(userSchema, { seed: 42 });
const b = fixture(userSchema, { seed: 42 });

console.log('seed 42 (first):', a);
console.log('seed 42 (second):', b);
console.log('identical?', JSON.stringify(a) === JSON.stringify(b));

// Different seeds produce different data

const c = fixture(userSchema, { seed: 99 });
console.log('seed 99:', c);

// Using withSeed transform with fixture.create()

const seededGen = fixture.create(withSeed(42));
const d = seededGen.one(userSchema);
console.log('withSeed(42):', d);
console.log('matches seed option?', JSON.stringify(a) === JSON.stringify(d));

// Generating multiple seeded values

const users = fixture.many(userSchema, 3, { seed: 123 });
console.log('3 seeded users:', JSON.stringify(users, null, 2));
