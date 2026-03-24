import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// Generate basic primitive types

const string = fixture(z.string());
console.log('string:', string);

const number = fixture(z.number());
console.log('number:', number);

const boolean = fixture(z.boolean());
console.log('boolean:', boolean);

const date = fixture(z.date());
console.log('date:', date);

const bigint = fixture(z.bigint());
console.log('bigint:', bigint);

const literal = fixture(z.literal('hello'));
console.log('literal:', literal);

const nullValue = fixture(z.null());
console.log('null:', nullValue);

const undefinedValue = fixture(z.undefined());
console.log('undefined:', undefinedValue);
