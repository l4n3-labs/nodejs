import { fixture } from '@l4n3/fakeish';
import { z } from 'zod';

// Enums

const roleSchema = z.enum(['admin', 'editor', 'viewer']);
const role = fixture(roleSchema).one();
console.log('role:', role);

// Simple object

const userSchema = z.object({
  name: z.string(),
  email: z.email(),
  age: z.number().int().min(18).max(99),
  role: roleSchema,
  active: z.boolean(),
});

const user = fixture(userSchema).one();
console.log('user:', user);

// Nested objects

const companySchema = z.object({
  name: z.string(),
  founded: z.date(),
  ceo: z.object({
    name: z.string(),
    email: z.email(),
  }),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string().length(5),
    country: z.literal('US'),
  }),
});

const company = fixture(companySchema).one();
console.log('company:', JSON.stringify(company, null, 2));

// Generate multiple objects

const users = fixture(userSchema).many(3);
console.log('3 users:', JSON.stringify(users, null, 2));
