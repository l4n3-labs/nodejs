import { fixture } from '@l4n3/zodgen';
import { toCSV, toJSONLines, toSQL } from '@l4n3/zodgen/formats';
import { z } from 'zod';

// Output format utilities convert generated data to CSV, SQL, or JSON Lines.
// Useful for database seeding, API mocking, and CI test data pipelines.

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
  active: z.boolean(),
});

const users = fixture(userSchema, { seed: 42 })
  .override('id', (ctx) => ctx.sequence + 1)
  .many(5);

// CSV output

console.log('=== CSV ===');
console.log(toCSV(users));

// SQL INSERT output

console.log('\n=== SQL ===');
console.log(toSQL(users, { table: 'users' }));

// JSON Lines output (one JSON object per line)

console.log('\n=== JSON Lines ===');
console.log(toJSONLines(users));
