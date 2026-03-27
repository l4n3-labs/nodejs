import { fixture } from '@l4n3/fakeish';
import { z } from 'zod';

// .invalid() and .invalidMany() generate values that violate the schema.
// Useful for negative testing — verifying that your validation rejects bad data.

const emailSchema = z.email();
const numberSchema = z.number().int().min(1).max(100);

const userSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  age: z.number().int().min(18).max(99),
  role: z.enum(['admin', 'editor', 'viewer']),
});

// Single invalid value for a string format

const badEmail = fixture(emailSchema).invalid();
console.log('Invalid email:', badEmail);
console.log('  Passes validation?', emailSchema.safeParse(badEmail).success);

// Single invalid value for a constrained number

const badNumber = fixture(numberSchema).invalid();
console.log('\nInvalid number:', badNumber);
console.log('  Passes validation?', numberSchema.safeParse(badNumber).success);

// Single invalid object — one field is corrupted

const badUser = fixture(userSchema).invalid();
console.log('\nInvalid user:', JSON.stringify(badUser, null, 2));
console.log('  Passes validation?', userSchema.safeParse(badUser).success);

// Batch invalid generation for exhaustive negative testing

const badUsers = fixture(userSchema).invalidMany(5);
console.log('\n5 invalid users:');
for (const user of badUsers) {
  const result = userSchema.safeParse(user);
  console.log(`  valid=${result.success}`, JSON.stringify(user));
}

// Combining with seed for reproducible invalid data

const seededBad = fixture(userSchema, { seed: 42 }).invalid();
const seededBad2 = fixture(userSchema, { seed: 42 }).invalid();
console.log('\nSeeded invalid (identical?):', JSON.stringify(seededBad) === JSON.stringify(seededBad2));
