import { fixture } from '@l4n3/fakeish';
import { z } from 'zod';

// Generate numbers with various constraints

const integer = fixture(z.number().int()).one();
console.log('integer:', integer);

const bounded = fixture(z.number().min(1).max(100)).one();
console.log('bounded (1-100):', bounded);

const positive = fixture(z.number().positive()).one();
console.log('positive:', positive);

const negative = fixture(z.number().negative()).one();
console.log('negative:', negative);

const multipleOf = fixture(z.number().multipleOf(5)).one();
console.log('multiple of 5:', multipleOf);

const age = fixture(z.number().int().min(18).max(99)).one();
console.log('age (int 18-99):', age);

// BigInt constraints

const bigintBounded = fixture(z.bigint().min(0n).max(1000n)).one();
console.log('bigint (0-1000):', bigintBounded);

// Date constraints

const futureDate = fixture(z.date().min(new Date())).one();
console.log('future date:', futureDate);

const pastDate = fixture(z.date().max(new Date())).one();
console.log('past date:', pastDate);
