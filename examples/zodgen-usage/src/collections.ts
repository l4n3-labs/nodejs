import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// Arrays

const tags = fixture(z.array(z.string()));
console.log('tags:', tags);

const scores = fixture(z.array(z.number().min(0).max(100)).min(3).max(5));
console.log('scores (3-5 items, 0-100):', scores);

// Tuples

const coordinate = fixture(z.tuple([z.number(), z.number()]));
console.log('coordinate:', coordinate);

const labeled = fixture(z.tuple([z.string(), z.number(), z.boolean()]));
console.log('labeled tuple:', labeled);

// Sets

const uniqueEmails = fixture(z.set(z.string().email()).min(2).max(4));
console.log('unique emails:', uniqueEmails);

// Maps

const userRoles = fixture(z.map(z.string().uuid(), z.enum(['admin', 'user'])));
console.log('user roles map:', userRoles);

// Records

const config = fixture(z.record(z.string(), z.number()));
console.log('config record:', config);

const featureFlags = fixture(z.record(z.string(), z.boolean()));
console.log('feature flags:', featureFlags);
