import type { GenContext, ZodCheckDef } from '../types.js';

// In Zod v4, startsWith/endsWith/includes are all string_format checks.
// We need to collect all string_format checks and handle them together.
const findAllFormats = (ctx: GenContext): ReadonlyArray<ZodCheckDef> =>
  ctx.checks.all().filter((c) => c.check === 'string_format');

export const generateString = (ctx: GenContext): string => {
  const { faker, checks } = ctx;

  const formats = findAllFormats(ctx);

  // Collect content constraints from string_format checks
  const prefix = formats.find((f) => f.format === 'starts_with')?.prefix as string | undefined;
  const suffix = formats.find((f) => f.format === 'ends_with')?.suffix as string | undefined;
  const include = formats.find((f) => f.format === 'includes')?.includes as string | undefined;

  // Check for well-known format types (only if no content constraints)
  const wellKnownFormat = formats.find(
    (f) => f.format !== 'starts_with' && f.format !== 'ends_with' && f.format !== 'includes',
  );

  if (wellKnownFormat && !prefix && !suffix && !include) {
    const format = wellKnownFormat.format as string;
    switch (format) {
      case 'email':
        return faker.internet.email();
      case 'url':
        return faker.internet.url();
      case 'uuid':
        return faker.string.uuid();
      case 'ip':
      case 'ipv4':
        return faker.internet.ip();
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

  const fixedLen = lengthEqualsCheck ? (lengthEqualsCheck.length as number) : undefined;
  const minLen = minCheck ? (minCheck.minimum as number) : 0;
  const maxLen = maxCheck ? (maxCheck.maximum as number) : 20;

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
