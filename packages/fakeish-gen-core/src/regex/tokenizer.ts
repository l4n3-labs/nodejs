export type Token =
  | { readonly type: 'literal'; readonly value: string }
  | { readonly type: 'dot' }
  | { readonly type: 'charClassStart'; readonly negated: boolean }
  | { readonly type: 'charClassEnd' }
  | { readonly type: 'charClassRange'; readonly start: string; readonly end: string }
  | { readonly type: 'charClassLiteral'; readonly value: string }
  | { readonly type: 'shorthand'; readonly value: string }
  | { readonly type: 'quantifier'; readonly min: number; readonly max: number }
  | { readonly type: 'groupStart'; readonly capturing: boolean }
  | { readonly type: 'groupEnd' }
  | { readonly type: 'alternation' }
  | { readonly type: 'anchor'; readonly kind: 'start' | 'end' | 'wordBoundary' }
  | { readonly type: 'backreference'; readonly index: number };

const SHORTHAND_CHARS = new Set(['d', 'D', 'w', 'W', 's', 'S']);

const ESCAPE_MAP: Record<string, string> = {
  t: '\t',
  n: '\n',
  r: '\r',
};

const parseEscapeSequence = (source: string, pos: number): { readonly token: Token; readonly advance: number } => {
  const next = source[pos + 1];

  if (next === undefined) {
    return { token: { type: 'literal', value: '\\' }, advance: 1 };
  }

  if (SHORTHAND_CHARS.has(next)) {
    return { token: { type: 'shorthand', value: `\\${next}` }, advance: 2 };
  }

  if (next === 'b') {
    return { token: { type: 'anchor', kind: 'wordBoundary' }, advance: 2 };
  }

  if (next in ESCAPE_MAP) {
    return { token: { type: 'literal', value: ESCAPE_MAP[next] }, advance: 2 };
  }

  if (next >= '1' && next <= '9') {
    return { token: { type: 'backreference', index: Number.parseInt(next, 10) }, advance: 2 };
  }

  return { token: { type: 'literal', value: next }, advance: 2 };
};

const parseCharClassEscape = (source: string, pos: number): { readonly token: Token; readonly advance: number } => {
  const next = source[pos + 1];

  if (next === undefined) {
    return { token: { type: 'charClassLiteral', value: '\\' }, advance: 1 };
  }

  if (SHORTHAND_CHARS.has(next)) {
    return { token: { type: 'shorthand', value: `\\${next}` }, advance: 2 };
  }

  if (next in ESCAPE_MAP) {
    return { token: { type: 'charClassLiteral', value: ESCAPE_MAP[next] }, advance: 2 };
  }

  return { token: { type: 'charClassLiteral', value: next }, advance: 2 };
};

const parseCharClass = (
  source: string,
  startPos: number,
): { readonly tokens: ReadonlyArray<Token>; readonly advance: number } => {
  const tokens: Token[] = [];
  let pos = startPos;

  // Check for negation
  const negated = source[pos] === '^';
  tokens[tokens.length] = { type: 'charClassStart', negated };
  if (negated) {
    pos += 1;
  }

  while (pos < source.length && source[pos] !== ']') {
    if (source[pos] === '\\') {
      const { token, advance } = parseCharClassEscape(source, pos);
      tokens[tokens.length] = token;
      pos += advance;
      continue;
    }

    // Check if this character is part of a range (a-z)
    // A '-' is literal if it's the first or last character in the class
    const isFirstInClass = tokens.length === 1; // only charClassStart before this
    const isLastBeforeClose = source[pos + 1] === ']';

    if (source[pos] === '-' && (isFirstInClass || isLastBeforeClose)) {
      tokens[tokens.length] = { type: 'charClassLiteral', value: '-' };
      pos += 1;
      continue;
    }

    if (source[pos + 1] === '-' && source[pos + 2] !== undefined && source[pos + 2] !== ']') {
      tokens[tokens.length] = { type: 'charClassRange', start: source[pos], end: source[pos + 2] };
      pos += 3;
      continue;
    }

    tokens[tokens.length] = { type: 'charClassLiteral', value: source[pos] };
    pos += 1;
  }

  // consume the closing ]
  if (source[pos] === ']') {
    tokens[tokens.length] = { type: 'charClassEnd' };
    pos += 1;
  }

  return { tokens, advance: pos - startPos };
};

const parseCurlyQuantifier = (
  source: string,
  startPos: number,
): { readonly token: Token; readonly advance: number } | null => {
  // Find the closing brace
  const closeIdx = source.indexOf('}', startPos);
  if (closeIdx === -1) {
    return null;
  }

  const inner = source.slice(startPos, closeIdx);
  const commaIdx = inner.indexOf(',');

  if (commaIdx === -1) {
    // {n}
    const n = Number.parseInt(inner, 10);
    if (Number.isNaN(n)) return null;
    return { token: { type: 'quantifier', min: n, max: n }, advance: closeIdx - startPos + 1 };
  }

  const minStr = inner.slice(0, commaIdx);
  const maxStr = inner.slice(commaIdx + 1);
  const min = Number.parseInt(minStr, 10);

  if (Number.isNaN(min)) return null;

  if (maxStr === '') {
    // {n,}
    return { token: { type: 'quantifier', min, max: Number.POSITIVE_INFINITY }, advance: closeIdx - startPos + 1 };
  }

  const max = Number.parseInt(maxStr, 10);
  if (Number.isNaN(max)) return null;

  return { token: { type: 'quantifier', min, max }, advance: closeIdx - startPos + 1 };
};

const parseGroup = (source: string, pos: number): { readonly token: Token; readonly advance: number } => {
  if (source[pos + 1] === '?') {
    if (source[pos + 2] === ':') {
      return { token: { type: 'groupStart', capturing: false }, advance: 3 };
    }
    if (
      source[pos + 2] === '=' ||
      source[pos + 2] === '!' ||
      (source[pos + 2] === '<' && (source[pos + 3] === '=' || source[pos + 3] === '!'))
    ) {
      throw new Error('Lookahead/lookbehind not supported');
    }
  }

  return { token: { type: 'groupStart', capturing: true }, advance: 1 };
};

export const tokenize = (source: string): ReadonlyArray<Token> => {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < source.length) {
    const ch = source[pos];

    if (ch === '\\') {
      const { token, advance } = parseEscapeSequence(source, pos);
      tokens[tokens.length] = token;
      pos += advance;
      continue;
    }

    if (ch === '[') {
      const { tokens: classTokens, advance } = parseCharClass(source, pos + 1);
      for (const t of classTokens) {
        tokens[tokens.length] = t;
      }
      pos += 1 + advance;
      continue;
    }

    if (ch === '(') {
      const { token, advance } = parseGroup(source, pos);
      tokens[tokens.length] = token;
      pos += advance;
      continue;
    }

    if (ch === ')') {
      tokens[tokens.length] = { type: 'groupEnd' };
      pos += 1;
      continue;
    }

    if (ch === '|') {
      tokens[tokens.length] = { type: 'alternation' };
      pos += 1;
      continue;
    }

    if (ch === '^') {
      tokens[tokens.length] = { type: 'anchor', kind: 'start' };
      pos += 1;
      continue;
    }

    if (ch === '$') {
      tokens[tokens.length] = { type: 'anchor', kind: 'end' };
      pos += 1;
      continue;
    }

    if (ch === '.') {
      tokens[tokens.length] = { type: 'dot' };
      pos += 1;
      continue;
    }

    if (ch === '*') {
      tokens[tokens.length] = { type: 'quantifier', min: 0, max: Number.POSITIVE_INFINITY };
      pos += 1;
      if (source[pos] === '?') pos += 1; // consume lazy marker
      continue;
    }

    if (ch === '+') {
      tokens[tokens.length] = { type: 'quantifier', min: 1, max: Number.POSITIVE_INFINITY };
      pos += 1;
      if (source[pos] === '?') pos += 1;
      continue;
    }

    if (ch === '?') {
      tokens[tokens.length] = { type: 'quantifier', min: 0, max: 1 };
      pos += 1;
      if (source[pos] === '?') pos += 1;
      continue;
    }

    if (ch === '{') {
      const result = parseCurlyQuantifier(source, pos + 1);
      if (result) {
        tokens[tokens.length] = result.token;
        pos += 1 + result.advance;
        if (source[pos] === '?') pos += 1; // consume lazy marker
        continue;
      }
      // If not a valid quantifier, treat as literal
      tokens[tokens.length] = { type: 'literal', value: '{' };
      pos += 1;
      continue;
    }

    tokens[tokens.length] = { type: 'literal', value: ch };
    pos += 1;
  }

  return tokens;
};
