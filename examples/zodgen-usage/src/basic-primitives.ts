import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// Generate basic primitive types

const string = fixture(z.string()).one();
console.log('string:', string);

const number = fixture(z.number()).one();
console.log('number:', number);

const boolean = fixture(z.boolean()).one();
console.log('boolean:', boolean);

const date = fixture(z.date()).one();
console.log('date:', date);

const bigint = fixture(z.bigint()).one();
console.log('bigint:', bigint);

const literal = fixture(z.literal('hello')).one();
console.log('literal:', literal);

const nullValue = fixture(z.null()).one();
console.log('null:', nullValue);

const undefinedValue = fixture(z.undefined()).one();
console.log('undefined:', undefinedValue);
