import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenizer.js';

describe('tokenize', () => {
  describe('literals', () => {
    it('should tokenize plain characters as literals', () => {
      const tokens = tokenize('abc');
      expect(tokens).toEqual([
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
        { type: 'literal', value: 'c' },
      ]);
    });
  });

  describe('escape sequences', () => {
    it('should tokenize shorthand character classes', () => {
      const tokens = tokenize('\\d\\w\\s');
      expect(tokens).toEqual([
        { type: 'shorthand', value: '\\d' },
        { type: 'shorthand', value: '\\w' },
        { type: 'shorthand', value: '\\s' },
      ]);
    });

    it('should tokenize negated shorthand character classes', () => {
      const tokens = tokenize('\\D\\W\\S');
      expect(tokens).toEqual([
        { type: 'shorthand', value: '\\D' },
        { type: 'shorthand', value: '\\W' },
        { type: 'shorthand', value: '\\S' },
      ]);
    });

    it('should tokenize escaped dot as literal', () => {
      const tokens = tokenize('\\.');
      expect(tokens).toEqual([{ type: 'literal', value: '.' }]);
    });

    it('should tokenize \\t as literal tab', () => {
      const tokens = tokenize('\\t');
      expect(tokens).toEqual([{ type: 'literal', value: '\t' }]);
    });

    it('should tokenize \\n as literal newline', () => {
      const tokens = tokenize('\\n');
      expect(tokens).toEqual([{ type: 'literal', value: '\n' }]);
    });

    it('should tokenize \\r as literal carriage return', () => {
      const tokens = tokenize('\\r');
      expect(tokens).toEqual([{ type: 'literal', value: '\r' }]);
    });

    it('should tokenize \\1 as backreference', () => {
      const tokens = tokenize('\\1');
      expect(tokens).toEqual([{ type: 'backreference', index: 1 }]);
    });

    it('should tokenize \\9 as backreference', () => {
      const tokens = tokenize('\\9');
      expect(tokens).toEqual([{ type: 'backreference', index: 9 }]);
    });

    it('should tokenize \\b as word boundary anchor', () => {
      const tokens = tokenize('\\b');
      expect(tokens).toEqual([{ type: 'anchor', kind: 'wordBoundary' }]);
    });

    it('should tokenize escaped special characters as literals', () => {
      const tokens = tokenize('\\\\\\*\\+\\?');
      expect(tokens).toEqual([
        { type: 'literal', value: '\\' },
        { type: 'literal', value: '*' },
        { type: 'literal', value: '+' },
        { type: 'literal', value: '?' },
      ]);
    });
  });

  describe('character classes', () => {
    it('should tokenize a simple range', () => {
      const tokens = tokenize('[a-z]');
      expect(tokens).toEqual([
        { type: 'charClassStart', negated: false },
        { type: 'charClassRange', start: 'a', end: 'z' },
        { type: 'charClassEnd' },
      ]);
    });

    it('should tokenize a negated class with range', () => {
      const tokens = tokenize('[^0-9]');
      expect(tokens).toEqual([
        { type: 'charClassStart', negated: true },
        { type: 'charClassRange', start: '0', end: '9' },
        { type: 'charClassEnd' },
      ]);
    });

    it('should tokenize shorthand inside character class', () => {
      const tokens = tokenize('[\\d]');
      expect(tokens).toEqual([
        { type: 'charClassStart', negated: false },
        { type: 'shorthand', value: '\\d' },
        { type: 'charClassEnd' },
      ]);
    });

    it('should tokenize escaped dash inside character class as literal', () => {
      const tokens = tokenize('[\\-]');
      expect(tokens).toEqual([
        { type: 'charClassStart', negated: false },
        { type: 'charClassLiteral', value: '-' },
        { type: 'charClassEnd' },
      ]);
    });

    it('should tokenize multiple ranges in a class', () => {
      const tokens = tokenize('[a-zA-Z0-9]');
      expect(tokens).toEqual([
        { type: 'charClassStart', negated: false },
        { type: 'charClassRange', start: 'a', end: 'z' },
        { type: 'charClassRange', start: 'A', end: 'Z' },
        { type: 'charClassRange', start: '0', end: '9' },
        { type: 'charClassEnd' },
      ]);
    });
  });

  describe('quantifiers', () => {
    it('should tokenize * as {0, Infinity}', () => {
      const tokens = tokenize('a*');
      expect(tokens).toEqual([
        { type: 'literal', value: 'a' },
        { type: 'quantifier', min: 0, max: Number.POSITIVE_INFINITY },
      ]);
    });

    it('should tokenize + as {1, Infinity}', () => {
      const tokens = tokenize('b+');
      expect(tokens).toEqual([
        { type: 'literal', value: 'b' },
        { type: 'quantifier', min: 1, max: Number.POSITIVE_INFINITY },
      ]);
    });

    it('should tokenize ? as {0, 1}', () => {
      const tokens = tokenize('c?');
      expect(tokens).toEqual([
        { type: 'literal', value: 'c' },
        { type: 'quantifier', min: 0, max: 1 },
      ]);
    });

    it('should tokenize {3} as {3, 3}', () => {
      const tokens = tokenize('x{3}');
      expect(tokens).toEqual([
        { type: 'literal', value: 'x' },
        { type: 'quantifier', min: 3, max: 3 },
      ]);
    });

    it('should tokenize {2,5}', () => {
      const tokens = tokenize('y{2,5}');
      expect(tokens).toEqual([
        { type: 'literal', value: 'y' },
        { type: 'quantifier', min: 2, max: 5 },
      ]);
    });

    it('should tokenize {1,} as {1, Infinity}', () => {
      const tokens = tokenize('z{1,}');
      expect(tokens).toEqual([
        { type: 'literal', value: 'z' },
        { type: 'quantifier', min: 1, max: Number.POSITIVE_INFINITY },
      ]);
    });
  });

  describe('lazy quantifiers', () => {
    it('should consume lazy marker after *', () => {
      const tokens = tokenize('a*?');
      expect(tokens).toEqual([
        { type: 'literal', value: 'a' },
        { type: 'quantifier', min: 0, max: Number.POSITIVE_INFINITY },
      ]);
    });

    it('should consume lazy marker after +', () => {
      const tokens = tokenize('a+?');
      expect(tokens).toEqual([
        { type: 'literal', value: 'a' },
        { type: 'quantifier', min: 1, max: Number.POSITIVE_INFINITY },
      ]);
    });

    it('should consume lazy marker after {n,m}', () => {
      const tokens = tokenize('a{2,5}?');
      expect(tokens).toEqual([
        { type: 'literal', value: 'a' },
        { type: 'quantifier', min: 2, max: 5 },
      ]);
    });
  });

  describe('groups', () => {
    it('should tokenize capturing group', () => {
      const tokens = tokenize('(abc)');
      expect(tokens).toEqual([
        { type: 'groupStart', capturing: true },
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
        { type: 'literal', value: 'c' },
        { type: 'groupEnd' },
      ]);
    });

    it('should tokenize non-capturing group', () => {
      const tokens = tokenize('(?:abc)');
      expect(tokens).toEqual([
        { type: 'groupStart', capturing: false },
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
        { type: 'literal', value: 'c' },
        { type: 'groupEnd' },
      ]);
    });
  });

  describe('alternation', () => {
    it('should tokenize pipe as alternation', () => {
      const tokens = tokenize('a|b');
      expect(tokens).toEqual([
        { type: 'literal', value: 'a' },
        { type: 'alternation' },
        { type: 'literal', value: 'b' },
      ]);
    });
  });

  describe('anchors', () => {
    it('should tokenize ^ and $', () => {
      const tokens = tokenize('^abc$');
      expect(tokens).toEqual([
        { type: 'anchor', kind: 'start' },
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
        { type: 'literal', value: 'c' },
        { type: 'anchor', kind: 'end' },
      ]);
    });
  });

  describe('dot', () => {
    it('should tokenize dot metacharacter', () => {
      const tokens = tokenize('a.b');
      expect(tokens).toEqual([{ type: 'literal', value: 'a' }, { type: 'dot' }, { type: 'literal', value: 'b' }]);
    });
  });

  describe('complex patterns', () => {
    it('should tokenize an email-like pattern without error', () => {
      const tokens = tokenize('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
      expect(tokens.length).toBeGreaterThan(0);

      // Verify some key structural tokens
      const types = tokens.map((t) => t.type);
      expect(types[0]).toBe('charClassStart');
      expect(types).toContain('literal'); // the '@'
      expect(types).toContain('quantifier');
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty string', () => {
      expect(tokenize('')).toEqual([]);
    });

    it('should treat leading dash in char class as literal', () => {
      const tokens = tokenize('[-a]');
      expect(tokens).toEqual([
        { type: 'charClassStart', negated: false },
        { type: 'charClassLiteral', value: '-' },
        { type: 'charClassLiteral', value: 'a' },
        { type: 'charClassEnd' },
      ]);
    });

    it('should treat trailing dash in char class as literal', () => {
      const tokens = tokenize('[a-]');
      expect(tokens).toEqual([
        { type: 'charClassStart', negated: false },
        { type: 'charClassLiteral', value: 'a' },
        { type: 'charClassLiteral', value: '-' },
        { type: 'charClassEnd' },
      ]);
    });
  });

  describe('error cases', () => {
    it('should throw for lookahead', () => {
      expect(() => tokenize('(?=abc)')).toThrow('Lookahead/lookbehind not supported');
    });

    it('should throw for negative lookahead', () => {
      expect(() => tokenize('(?!abc)')).toThrow('Lookahead/lookbehind not supported');
    });

    it('should throw for lookbehind', () => {
      expect(() => tokenize('(?<=abc)')).toThrow('Lookahead/lookbehind not supported');
    });

    it('should throw for negative lookbehind', () => {
      expect(() => tokenize('(?<!abc)')).toThrow('Lookahead/lookbehind not supported');
    });
  });
});
