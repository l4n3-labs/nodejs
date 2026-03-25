import type { z } from 'zod/v4';
import type { GenContext } from '../types.js';
import { findSemanticString } from './semantic.js';

// In Zod v4, startsWith/endsWith/includes are all string_format checks.
// Shorthand schemas like z.email() put format directly on the def instead of in checks[].
const findAllFormats = <T = string>(ctx: GenContext<T, 'string'>): ReadonlyArray<z.core.$ZodCheckStringFormatDef> => {
  const fromChecks = ctx.checks.all().filter((c): c is z.core.$ZodCheckStringFormatDef => c.check === 'string_format');
  const def = ctx.def as z.core.$ZodStringDef & { check?: string; format?: string };
  if (def.check === 'string_format' && def.format) {
    return [...fromChecks, def as unknown as z.core.$ZodCheckStringFormatDef];
  }
  return fromChecks;
};

export const generateString = <T = string>(ctx: GenContext<T, 'string'>): string => {
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
      case 'cidrv4':
        return `${faker.internet.ipv4()}/${faker.number.int({ min: 0, max: 32 })}`;
      case 'cidrv6':
        return `${faker.internet.ipv6()}/${faker.number.int({ min: 0, max: 128 })}`;
      case 'duration':
        return `P${faker.number.int({ min: 1, max: 30 })}DT${faker.number.int({ min: 0, max: 23 })}H${faker.number.int({ min: 0, max: 59 })}M${faker.number.int({ min: 0, max: 59 })}S`;
      case 'jwt': {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
        const payload = btoa(JSON.stringify({ sub: faker.string.uuid(), iat: Math.floor(Date.now() / 1000) })).replace(
          /=/g,
          '',
        );
        const signature = faker.string.alphanumeric(43);
        return `${header}.${payload}.${signature}`;
      }
      case 'e164':
        return `+${faker.string.numeric({ length: { min: 8, max: 15 } })}`;
      case 'hex':
        return faker.string.hexadecimal({ length: 16, casing: 'lower' }).slice(2);
      case 'hostname':
        return faker.internet.domainName();
      case 'ksuid':
        return faker.string.alphanumeric(27);
      case 'xid':
        return faker.string.alphanumeric(20).toLowerCase();
      case 'regex':
        return `^[a-z]{${faker.number.int({ min: 1, max: 10 })}}$`;
      default:
        break;
    }
  }

  // Semantic field name detection (only when no format checks and no length constraints)
  const hasLengthConstraints = checks.has('min_length') || checks.has('max_length') || checks.has('length_equals');
  if (ctx.config.semanticFieldDetection && formats.length === 0 && !hasLengthConstraints) {
    const fieldName = ctx.path.at(-1);
    if (fieldName) {
      const semanticGen = findSemanticString(fieldName);
      if (semanticGen) return semanticGen(faker);
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
