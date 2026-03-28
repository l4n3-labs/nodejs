import { describe, expect, it } from 'vitest';
import type { RegexNode } from './ast.js';
import { parse } from './parser.js';
import { tokenize } from './tokenizer.js';

describe('parse', () => {
  it('should parse simple literals into a SequenceNode', () => {
    const result = parse(tokenize('abc'));
    expect(result).toEqual({
      type: 'sequence',
      elements: [
        { type: 'literal', char: 'a' },
        { type: 'literal', char: 'b' },
        { type: 'literal', char: 'c' },
      ],
    } satisfies RegexNode);
  });

  it('should parse a single literal without wrapping in a sequence', () => {
    const result = parse(tokenize('a'));
    expect(result).toEqual({ type: 'literal', char: 'a' } satisfies RegexNode);
  });

  it('should parse alternation', () => {
    const result = parse(tokenize('a|b'));
    expect(result).toEqual({
      type: 'alternation',
      alternatives: [
        { type: 'literal', char: 'a' },
        { type: 'literal', char: 'b' },
      ],
    } satisfies RegexNode);
  });

  it('should parse quantifier with explicit min and max', () => {
    const result = parse(tokenize('a{2,5}'));
    expect(result).toEqual({
      type: 'quantifier',
      body: { type: 'literal', char: 'a' },
      min: 2,
      max: 5,
    } satisfies RegexNode);
  });

  it('should parse * quantifier with capped max', () => {
    const result = parse(tokenize('a*'));
    expect(result).toEqual({
      type: 'quantifier',
      body: { type: 'literal', char: 'a' },
      min: 0,
      max: 5,
    } satisfies RegexNode);
  });

  it('should parse + quantifier with capped max', () => {
    const result = parse(tokenize('a+'));
    expect(result).toEqual({
      type: 'quantifier',
      body: { type: 'literal', char: 'a' },
      min: 1,
      max: 6,
    } satisfies RegexNode);
  });

  it('should parse a character class with range', () => {
    const result = parse(tokenize('[a-z]'));
    expect(result).toEqual({
      type: 'charClass',
      ranges: [{ start: 'a', end: 'z' }],
      negated: false,
    } satisfies RegexNode);
  });

  it('should parse a negated character class', () => {
    const result = parse(tokenize('[^0-9]'));
    expect(result).toEqual({
      type: 'charClass',
      ranges: [{ start: '0', end: '9' }],
      negated: true,
    } satisfies RegexNode);
  });

  it('should parse shorthand \\d into CharClassNode', () => {
    const result = parse(tokenize('\\d'));
    expect(result).toEqual({
      type: 'charClass',
      ranges: [{ start: '0', end: '9' }],
      negated: false,
    } satisfies RegexNode);
  });

  it('should parse dot', () => {
    const result = parse(tokenize('.'));
    expect(result).toEqual({ type: 'dot' } satisfies RegexNode);
  });

  it('should parse a capturing group', () => {
    const result = parse(tokenize('(abc)'));
    expect(result).toEqual({
      type: 'group',
      body: {
        type: 'sequence',
        elements: [
          { type: 'literal', char: 'a' },
          { type: 'literal', char: 'b' },
          { type: 'literal', char: 'c' },
        ],
      },
      capturing: true,
      index: 1,
    } satisfies RegexNode);
  });

  it('should parse a non-capturing group', () => {
    const result = parse(tokenize('(?:abc)'));
    expect(result).toEqual({
      type: 'group',
      body: {
        type: 'sequence',
        elements: [
          { type: 'literal', char: 'a' },
          { type: 'literal', char: 'b' },
          { type: 'literal', char: 'c' },
        ],
      },
      capturing: false,
      index: null,
    } satisfies RegexNode);
  });

  it('should assign correct group indices for nested groups', () => {
    const result = parse(tokenize('((a)(b))'));

    expect(result).toMatchObject({
      type: 'group',
      capturing: true,
      index: 1,
      body: {
        type: 'sequence',
        elements: [
          { type: 'group', capturing: true, index: 2, body: { type: 'literal', char: 'a' } },
          { type: 'group', capturing: true, index: 3, body: { type: 'literal', char: 'b' } },
        ],
      },
    });
  });

  it('should parse backreference', () => {
    const result = parse(tokenize('(a)\\1'));
    expect(result).toEqual({
      type: 'sequence',
      elements: [
        {
          type: 'group',
          body: { type: 'literal', char: 'a' },
          capturing: true,
          index: 1,
        },
        { type: 'backreference', index: 1 },
      ],
    } satisfies RegexNode);
  });

  it('should parse a complex pattern [A-Z]{2}-\\d{4}', () => {
    const result = parse(tokenize('[A-Z]{2}-\\d{4}'));
    expect(result).toEqual({
      type: 'sequence',
      elements: [
        {
          type: 'quantifier',
          body: { type: 'charClass', ranges: [{ start: 'A', end: 'Z' }], negated: false },
          min: 2,
          max: 2,
        },
        { type: 'literal', char: '-' },
        {
          type: 'quantifier',
          body: { type: 'charClass', ranges: [{ start: '0', end: '9' }], negated: false },
          min: 4,
          max: 4,
        },
      ],
    } satisfies RegexNode);
  });

  it('should parse anchors', () => {
    const result = parse(tokenize('^abc$'));
    expect(result).toEqual({
      type: 'sequence',
      elements: [
        { type: 'anchor', kind: 'start' },
        { type: 'literal', char: 'a' },
        { type: 'literal', char: 'b' },
        { type: 'literal', char: 'c' },
        { type: 'anchor', kind: 'end' },
      ],
    } satisfies RegexNode);
  });

  it('should cap infinity max to min + 5', () => {
    const result = parse(tokenize('a*'));
    expect(result).toMatchObject({
      type: 'quantifier',
      min: 0,
      max: 5,
    });
  });

  it('should handle empty input', () => {
    const result = parse(tokenize(''));
    expect(result).toEqual({
      type: 'sequence',
      elements: [],
    } satisfies RegexNode);
  });

  it('should handle empty alternation branches', () => {
    const result = parse(tokenize('a|'));
    expect(result).toEqual({
      type: 'alternation',
      alternatives: [
        { type: 'literal', char: 'a' },
        { type: 'sequence', elements: [] },
      ],
    } satisfies RegexNode);
  });

  it('should parse shorthand inside character class', () => {
    const result = parse(tokenize('[\\d]'));
    expect(result).toEqual({
      type: 'charClass',
      ranges: [{ start: '0', end: '9' }],
      negated: false,
    } satisfies RegexNode);
  });

  it('should parse character class with mixed ranges and literals', () => {
    const result = parse(tokenize('[a-z0]'));
    expect(result).toEqual({
      type: 'charClass',
      ranges: [
        { start: 'a', end: 'z' },
        { start: '0', end: '0' },
      ],
      negated: false,
    } satisfies RegexNode);
  });
});
