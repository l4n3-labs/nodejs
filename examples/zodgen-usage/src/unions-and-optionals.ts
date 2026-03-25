import { fixture } from '@l4n3/zodgen';
import { z } from 'zod';

// Union types — picks one option randomly

const stringOrNumber = fixture(z.union([z.string(), z.number()]));
console.log('string | number:', stringOrNumber);

const shape = fixture(
  z.union([
    z.object({ type: z.literal('circle'), radius: z.number().positive() }),
    z.object({ type: z.literal('rect'), width: z.number().positive(), height: z.number().positive() }),
  ]),
);
console.log('shape:', shape);

// Intersection — merges object properties

const withTimestamps = z.object({ createdAt: z.date(), updatedAt: z.date() });
const withName = z.object({ name: z.string() });
const timestamped = fixture(z.intersection(withTimestamps, withName));
console.log('intersection:', timestamped);

// Nullable — ~80% value, ~20% null

const nullableName = fixture(z.string().nullable());
console.log('nullable string:', nullableName);

// Optional — ~80% value, ~20% undefined

const optionalAge = fixture(z.number().optional());
console.log('optional number:', optionalAge);

// Default — generates the inner value (ignores default)

const withDefault = fixture(z.string().default('fallback'));
console.log('with default:', withDefault);

// Readonly — freezes the generated object

const readonlyUser = fixture(
  z
    .object({
      id: z.uuid(),
      name: z.string(),
    })
    .readonly(),
);
console.log('readonly user:', readonlyUser);
console.log('is frozen:', Object.isFrozen(readonlyUser));
