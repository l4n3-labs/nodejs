import type { z } from 'zod/v4';
import { schemaDef } from '../schema-def.js';
import type { GenContext } from '../types.js';

// In Zod v4, startsWith/endsWith/includes are all string_format checks.
// Shorthand schemas like z.email() put format directly on the def instead of in checks[].
const findAllFormats = <T = string>(ctx: GenContext<T>): ReadonlyArray<z.core.$ZodCheckStringFormatDef> => {
  const fromChecks = ctx.checks.all().filter((c): c is z.core.$ZodCheckStringFormatDef => c.check === 'string_format');
  const def = schemaDef<z.core.$ZodTypeDef & { check?: string; format?: string }>(ctx.schema);
  if (def.check === 'string_format' && def.format) {
    return [...fromChecks, def as unknown as z.core.$ZodCheckStringFormatDef];
  }
  return fromChecks;
};

export const generateString = <T = string>(ctx: GenContext<T>): string => {
  const { faker, checks } = ctx;

  const formats = findAllFormats(ctx);

  // Collect content constraints from string_format checks
  const prefix = formats.find((f): f is z.core.$ZodCheckStartsWithDef => f.format === 'starts_with')?.prefix;
  const suffix = formats.find((f): f is z.core.$ZodCheckEndsWithDef => f.format === 'ends_with')?.suffix;
  const include = formats.find((f): f is z.core.$ZodCheckIncludesDef => f.format === 'includes')?.includes;

  // Check for well-known format types (only if no content constraints)
  const wellKnownFormat = formats.find(
    (f) => f.format !== 'starts_with' && f.format !== 'ends_with' && f.format !== 'includes',
  );

  if (wellKnownFormat && !prefix && !suffix && !include) {
    const { format } = wellKnownFormat;
    switch (format) {
      case 'email':
        return faker.internet.email();
      case 'url':
        return faker.internet.url();
      case 'uuid':
        return faker.string.uuid();
      case 'ip':
      case 'ipv4':
        return faker.internet.ipv4();
      case 'ipv6':
        return faker.internet.ipv6();
      case 'cuid':
        return `c${faker.string.alphanumeric(24)}`;
      case 'cuid2':
        return faker.string.alphanumeric(24).toLowerCase();
      case 'ulid':
        return faker.string.alphanumeric(26).toUpperCase();
      case 'nanoid':
        return faker.string.alphanumeric(21);
      case 'emoji':
        return faker.internet.emoji();
      case 'base64':
        return faker.string.alphanumeric(12);
      case 'base64url':
        return faker.string.alphanumeric(12);
      case 'datetime':
        return faker.date.recent().toISOString();
      case 'date':
        return faker.date.recent().toISOString().split('T')[0] ?? '';
      case 'time':
        return faker.date.recent().toISOString().split('T')[1]?.replace('Z', '') ?? '';
      default:
        break;
    }
  }

  const minCheck = checks.find('min_length');
  const maxCheck = checks.find('max_length');
  const lengthEqualsCheck = checks.find('length_equals');

  const pre = prefix ?? '';
  const suf = suffix ?? '';
  const mid = include ?? '';

  const fixedLen = lengthEqualsCheck ? lengthEqualsCheck.length : undefined;
  const minLen = minCheck ? minCheck.minimum : 0;
  const maxLen = maxCheck ? maxCheck.maximum : 20;

  const overhead = pre.length + suf.length + mid.length;

  if (fixedLen !== undefined) {
    const remaining = Math.max(0, fixedLen - overhead);
    const half = Math.floor(remaining / 2);
    const otherHalf = remaining - half;
    return `${pre}${faker.string.alpha(half)}${mid}${faker.string.alpha(otherHalf)}${suf}`;
  }

  const effectiveMin = Math.max(minLen, overhead);
  const effectiveMax = Math.max(effectiveMin, maxLen);
  const randomLen = faker.number.int({ min: effectiveMin, max: effectiveMax });
  const remaining = Math.max(0, randomLen - overhead);
  const half = Math.floor(remaining / 2);
  const otherHalf = remaining - half;

  return `${pre}${faker.string.alpha(half)}${mid}${faker.string.alpha(otherHalf)}${suf}`;
};
