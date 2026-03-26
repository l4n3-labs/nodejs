import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// .partialOverride() overrides specific sub-fields of a nested object
// or array-of-objects field, without replacing the entire parent.

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string().length(5),
  country: z.string(),
});

const userSchema = z.object({
  name: z.string(),
  email: z.email(),
  address: addressSchema,
});

// Override only the city and country inside the address

const gen = fixture(userSchema, { seed: 42 }).partialOverride('address', {
  city: () => 'San Francisco',
  country: () => 'US',
});

const user = gen.one();
console.log('Partial override on nested object:');
console.log('  city:', user.address.city); // San Francisco
console.log('  country:', user.address.country); // US
console.log('  street:', user.address.street); // randomly generated
console.log('  zip:', user.address.zip); // randomly generated

// Works with arrays of objects too

const teamSchema = z.object({
  name: z.string(),
  members: z
    .array(
      z.object({
        name: z.string(),
        role: z.enum(['lead', 'member']),
        active: z.boolean(),
      }),
    )
    .min(2)
    .max(4),
});

const teamGen = fixture(teamSchema, { seed: 42 }).partialOverride('members', {
  active: () => true,
});

const team = teamGen.one();
console.log('\nPartial override on array items:');
console.log('  team:', team.name);
for (const member of team.members) {
  console.log(`  ${member.name} (${member.role}) — active: ${member.active}`);
}

// Combine partialOverride with regular override

const combined = fixture(teamSchema, { seed: 42 })
  .override('name', () => 'Engineering')
  .partialOverride('members', { role: () => 'member' as const });

const eng = combined.one();
console.log('\nCombined overrides:');
console.log('  team:', eng.name);
for (const member of eng.members) {
  console.log(`  ${member.name} — ${member.role}`);
}
