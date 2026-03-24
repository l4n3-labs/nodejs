import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// Generate numbers with various constraints

const integer = fixture(z.number().int());
console.log('integer:', integer);

const bounded = fixture(z.number().min(1).max(100));
console.log('bounded (1-100):', bounded);

const positive = fixture(z.number().positive());
console.log('positive:', positive);

const negative = fixture(z.number().negative());
console.log('negative:', negative);

const multipleOf = fixture(z.number().multipleOf(5));
console.log('multiple of 5:', multipleOf);

const age = fixture(z.number().int().min(18).max(99));
console.log('age (int 18-99):', age);

// BigInt constraints

const bigintBounded = fixture(z.bigint().min(0n).max(1000n));
console.log('bigint (0-1000):', bigintBounded);

// Date constraints

const futureDate = fixture(z.date().min(new Date()));
console.log('future date:', futureDate);

const pastDate = fixture(z.date().max(new Date()));
console.log('past date:', pastDate);
