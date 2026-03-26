import { de, ja } from '@faker-js/faker';
import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// .locale() sets Faker.js locales for localized data generation.
// Field names like "name", "city", and "address" produce locale-aware values.

const personSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  city: z.string(),
  phone: z.string(),
});

// Default locale (English)

const english = fixture(personSchema, { seed: 42 }).one();
console.log('English:', english);

// German locale via .locale()

const german = fixture(personSchema, { seed: 42 }).locale([de]).one();
console.log('German:', german);

// Japanese locale via FixtureOptions

const japanese = fixture(personSchema, { seed: 42, locale: [ja] }).one();
console.log('Japanese:', japanese);

// Batch generation with locale

const germanUsers = fixture(personSchema, { seed: 1 }).locale([de]).many(3);
console.log('\nGerman users:');
for (const user of germanUsers) {
  console.log(`  ${user.firstName} ${user.lastName} — ${user.city}`);
}
