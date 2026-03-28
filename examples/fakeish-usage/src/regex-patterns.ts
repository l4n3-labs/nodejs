import { fixture } from '@l4n3/fakeish';
import { z } from 'zod';

// Generate strings matching regular expressions

// Simple character class with quantifier
const hexColor = fixture(z.string().regex(/[0-9a-f]{6}/)).one();
console.log('hex color:', hexColor);

// Fixed literal mixed with dynamic parts
const productCode = fixture(z.string().regex(/[A-Z]{2}-\d{4}/)).one();
console.log('product code:', productCode);

// Alternation
const prefix = fixture(z.string().regex(/(Mr|Mrs|Dr)\. [A-Z][a-z]{2,8}/)).one();
console.log('prefix:', prefix);

// Phone-like pattern
const phone = fixture(z.string().regex(/\d{3}-\d{3}-\d{4}/)).one();
console.log('phone:', phone);

// Complex pattern in an object schema
const OrderSchema = z.object({
  orderId: z.string().regex(/ORD-\d{6}/),
  trackingCode: z.string().regex(/[A-Z0-9]{10}/),
  status: z.enum(['pending', 'shipped', 'delivered']),
});

const order = fixture(OrderSchema).one();
console.log('order:', order);

// Batch generation — every item matches
const serialNumbers = fixture(z.string().regex(/SN-[A-Z]{2}\d{4}/)).many(5);
console.log('serial numbers:', serialNumbers);

// Deterministic regex output with seed
const a = fixture(z.string().regex(/[a-z]{10}/), { seed: 42 }).one();
const b = fixture(z.string().regex(/[a-z]{10}/), { seed: 42 }).one();
console.log('seeded (equal):', a === b, a);
