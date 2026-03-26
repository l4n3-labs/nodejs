import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// .for() rebinds a configured generator to a different schema.
// The seed, overrides, and configuration carry over to the new schema.

const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

const productSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  price: z.number().positive(),
  inStock: z.boolean(),
});

// Build a configured generator with seed and overrides

const baseGen = fixture(userSchema, { seed: 42 }).override('name', () => 'Shared Config');

const user = baseGen.one();
console.log('User:', user);

// Switch to a different schema — seed carries over

const productGen = baseGen.for(productSchema);
const product = productGen.one();
console.log('Product:', product);

// The name override carries over because it matches by field name

console.log('Product name is "Shared Config"?', product.name === 'Shared Config');

// Useful for sharing configuration across related schemas

const orderSchema = z.object({
  id: z.uuid(),
  total: z.number().positive(),
  status: z.enum(['pending', 'shipped', 'delivered']),
});

const orderGen = baseGen.for(orderSchema);
const order = orderGen.one();
console.log('\nOrder (same seed, shared config):', order);
