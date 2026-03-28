import type { CharRange, RegexNode } from './ast.js';
import type { Token } from './tokenizer.js';

const SHORTHAND_RANGES: Record<string, { readonly ranges: ReadonlyArray<CharRange>; readonly negated: boolean }> = {
  '\\d': { ranges: [{ start: '0', end: '9' }], negated: false },
  '\\D': { ranges: [{ start: '0', end: '9' }], negated: true },
  '\\w': {
    ranges: [
      { start: 'a', end: 'z' },
      { start: 'A', end: 'Z' },
      { start: '0', end: '9' },
      { start: '_', end: '_' },
    ],
    negated: false,
  },
  '\\W': {
    ranges: [
      { start: 'a', end: 'z' },
      { start: 'A', end: 'Z' },
      { start: '0', end: '9' },
      { start: '_', end: '_' },
    ],
    negated: true,
  },
  '\\s': {
    ranges: [
      { start: ' ', end: ' ' },
      { start: '\t', end: '\t' },
      { start: '\n', end: '\n' },
      { start: '\r', end: '\r' },
    ],
    negated: false,
  },
  '\\S': {
    ranges: [
      { start: ' ', end: ' ' },
      { start: '\t', end: '\t' },
      { start: '\n', end: '\n' },
      { start: '\r', end: '\r' },
    ],
    negated: true,
  },
};

const INFINITY_CAP_OFFSET = 5;

export const parse = (tokens: ReadonlyArray<Token>): RegexNode => {
  let pos = 0;
  let groupCounter = 0;

  const peek = (): Token | undefined => tokens[pos];

  const advance = (): Token => {
    const token = tokens[pos];
    pos += 1;
    return token;
  };

  const parseRegex = (): RegexNode => parseAlternation();

  const parseAlternation = (): RegexNode => {
    const first = parseSequence();
    const alternatives: RegexNode[] = [first];

    while (peek()?.type === 'alternation') {
      advance();
      alternatives[alternatives.length] = parseSequence();
    }

    if (alternatives.length === 1) {
      return first;
    }

    return { type: 'alternation', alternatives } satisfies RegexNode;
  };

  const parseSequence = (): RegexNode => {
    const elements: RegexNode[] = [];

    while (pos < tokens.length && peek()?.type !== 'groupEnd' && peek()?.type !== 'alternation') {
      elements[elements.length] = parseQuantified();
    }

    if (elements.length === 0) {
      return { type: 'sequence', elements: [] } satisfies RegexNode;
    }

    if (elements.length === 1) {
      return elements[0];
    }

    return { type: 'sequence', elements } satisfies RegexNode;
  };

  const parseQuantified = (): RegexNode => {
    const atom = parseAtom();

    if (peek()?.type === 'quantifier') {
      const quantToken = advance();
      if (quantToken.type !== 'quantifier') throw new Error('Expected quantifier token');

      const max = quantToken.max === Number.POSITIVE_INFINITY ? quantToken.min + INFINITY_CAP_OFFSET : quantToken.max;

      return { type: 'quantifier', body: atom, min: quantToken.min, max } satisfies RegexNode;
    }

    return atom;
  };

  const parseCharClass = (negated: boolean): RegexNode => {
    const ranges: CharRange[] = [];

    while (pos < tokens.length && peek()?.type !== 'charClassEnd') {
      const token = advance();

      if (token.type === 'charClassRange') {
        ranges[ranges.length] = { start: token.start, end: token.end };
      } else if (token.type === 'charClassLiteral') {
        ranges[ranges.length] = { start: token.value, end: token.value };
      } else if (token.type === 'shorthand') {
        const shorthand = SHORTHAND_RANGES[token.value];
        if (shorthand) {
          for (const range of shorthand.ranges) {
            ranges[ranges.length] = range;
          }
        }
      }
    }

    // consume charClassEnd
    if (peek()?.type === 'charClassEnd') {
      advance();
    }

    return { type: 'charClass', ranges, negated } satisfies RegexNode;
  };

  const parseAtom = (): RegexNode => {
    const token = advance();

    if (token === undefined) {
      return { type: 'literal', char: '' } satisfies RegexNode;
    }

    switch (token.type) {
      case 'literal':
        return { type: 'literal', char: token.value } satisfies RegexNode;

      case 'shorthand': {
        const shorthand = SHORTHAND_RANGES[token.value];
        if (shorthand) {
          return { type: 'charClass', ranges: shorthand.ranges, negated: shorthand.negated } satisfies RegexNode;
        }
        return { type: 'literal', char: token.value } satisfies RegexNode;
      }

      case 'dot':
        return { type: 'dot' } satisfies RegexNode;

      case 'charClassStart':
        return parseCharClass(token.negated);

      case 'groupStart': {
        const capturing = token.capturing;
        if (capturing) {
          groupCounter += 1;
        }
        const index = capturing ? groupCounter : null;
        const body = parseRegex();

        // consume groupEnd
        if (peek()?.type === 'groupEnd') {
          advance();
        }

        return { type: 'group', body, capturing, index } satisfies RegexNode;
      }

      case 'anchor':
        return { type: 'anchor', kind: token.kind } satisfies RegexNode;

      case 'backreference':
        return { type: 'backreference', index: token.index } satisfies RegexNode;

      default:
        throw new Error(`Unexpected token type: ${token.type}`);
    }
  };

  return parseRegex();
};
