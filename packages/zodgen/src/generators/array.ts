import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

export const generateArray = (ctx: GenContext): unknown[] => {
  const { element } = schemaDef<z.core.$ZodArrayDef>(ctx.schema);
  const { checks, faker } = ctx;

  const minCheck = checks.find('min_length');
  const maxCheck = checks.find('max_length');
  const lengthCheck = checks.find('length_equals');

  const min = minCheck ? minCheck.minimum : 1;
  const max = maxCheck ? maxCheck.maximum : Math.max(3, min);
  const count = lengthCheck ? lengthCheck.length : faker.number.int({ min, max });

  return Array.from({ length: count }, () => ctx.generate(element as z.ZodType));
};
