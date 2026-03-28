import { generateFromPattern } from '../regex/generator.js';
import type { GenContext, StringNode } from '../schema.js';

export const generateString = (ctx: GenContext<StringNode>): string => {
  const { faker } = ctx;
  const { constraints } = ctx.node;

  if (constraints.pattern) {
    return generateFromPattern(constraints.pattern, faker);
  }

  // Check for well-known format types (only if no content constraints)
  const { startsWith: prefix, endsWith: suffix, includes: include, format } = constraints;

  if (format && !prefix && !suffix && !include) {
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

  const pre = prefix ?? '';
  const suf = suffix ?? '';
  const mid = include ?? '';

  const fixedLen = constraints.exactLength;
  const minLen = constraints.minLength ?? 0;
  const maxLen = constraints.maxLength ?? 20;

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
