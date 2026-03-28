import { en, Faker, faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { generateFromPattern } from './generator.js';

const assertMatchesPattern = (pattern: string, iterations = 20) => {
  const regex = new RegExp(`^${pattern}$`);
  for (const _ of Array.from({ length: iterations })) {
    const result = generateFromPattern(pattern, faker);
    expect(result).toMatch(regex);
  }
};

describe('generateFromPattern', () => {
  describe('simple patterns', () => {
    it('generates exact literal string', () => {
      const result = generateFromPattern('abc', faker);
      expect(result).toBe('abc');
    });

    it('generates a single lowercase letter from [a-z]', () => {
      assertMatchesPattern('[a-z]');
    });

    it('generates a single digit from \\d', () => {
      assertMatchesPattern('\\d');
    });

    it('generates one of the alternation options', () => {
      assertMatchesPattern('(foo|bar|baz)');
    });
  });

  describe('quantifiers', () => {
    it('generates exact count with {n}', () => {
      const result = generateFromPattern('a{3}', faker);
      expect(result).toBe('aaa');
    });

    it('generates n characters from char class with {n}', () => {
      assertMatchesPattern('[a-z]{5}');
    });

    it('generates between min and max digits with {n,m}', () => {
      assertMatchesPattern('\\d{2,4}');
    });

    it('generates 0 to capped count with *', () => {
      assertMatchesPattern('a*');
    });

    it('generates 1 to capped count with +', () => {
      assertMatchesPattern('b+');
    });
  });

  describe('character classes', () => {
    it('generates an uppercase letter from [A-Z]', () => {
      assertMatchesPattern('[A-Z]');
    });

    it('generates a hex digit from [0-9a-f]', () => {
      assertMatchesPattern('[0-9a-f]');
    });

    it('generates a non-digit printable ASCII from [^0-9]', () => {
      assertMatchesPattern('[^0-9]');
    });
  });

  describe('groups', () => {
    it('generates literal content from capturing group', () => {
      const result = generateFromPattern('(abc)', faker);
      expect(result).toBe('abc');
    });

    it('generates literal content from non-capturing group', () => {
      const result = generateFromPattern('(?:abc)', faker);
      expect(result).toBe('abc');
    });

    it('generates correct combinations from sequential alternation groups', () => {
      const valid = new Set(['ac', 'ad', 'bc', 'bd']);
      for (const _ of Array.from({ length: 50 })) {
        const result = generateFromPattern('(a|b)(c|d)', faker);
        expect(valid.has(result)).toBe(true);
      }
    });
  });

  describe('backreferences', () => {
    it('generates matching pairs with backreference', () => {
      const valid = new Set(['aa', 'bb']);
      for (const _ of Array.from({ length: 50 })) {
        const result = generateFromPattern('(a|b)\\1', faker);
        expect(valid.has(result)).toBe(true);
      }
    });
  });

  describe('anchors', () => {
    it('produces nothing for anchors', () => {
      const result = generateFromPattern('^abc$', faker);
      expect(result).toBe('abc');
    });
  });

  describe('complex real-world patterns', () => {
    it('generates plate-like pattern [A-Z]{2}-\\d{4}', () => {
      assertMatchesPattern('[A-Z]{2}-\\d{4}');
    });

    it('generates phone-like pattern \\d{3}-\\d{3}-\\d{4}', () => {
      assertMatchesPattern('\\d{3}-\\d{3}-\\d{4}');
    });

    it('generates variable-length lowercase string [a-z]{3,8}', () => {
      assertMatchesPattern('[a-z]{3,8}');
    });
  });

  describe('dot', () => {
    it('generates any printable ASCII character from dot', () => {
      assertMatchesPattern('.');
    });

    it('generates a<any>b from a.b', () => {
      assertMatchesPattern('a.b');
    });
  });

  describe('seed determinism', () => {
    it('produces identical output with the same seed', () => {
      const f1 = new Faker({ locale: [en] });
      const f2 = new Faker({ locale: [en] });
      f1.seed(42);
      f2.seed(42);

      const pattern = '[A-Z]{2}-\\d{4}';
      const result1 = generateFromPattern(pattern, f1);
      const result2 = generateFromPattern(pattern, f2);
      expect(result1).toBe(result2);
    });
  });

  describe('edge cases', () => {
    it('returns empty string for empty pattern', () => {
      const result = generateFromPattern('', faker);
      expect(result).toBe('');
    });

    it('returns the character for single char pattern', () => {
      const result = generateFromPattern('x', faker);
      expect(result).toBe('x');
    });
  });
});
