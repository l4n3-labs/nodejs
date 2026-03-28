import type { CharRange } from './ast.js';

const PRINTABLE_ASCII_START = 0x20;
const PRINTABLE_ASCII_END = 0x7e;

/** Expand a single CharRange into an array of character codes */
export const expandRange = (range: CharRange): ReadonlyArray<number> => {
  const start = range.start.codePointAt(0) ?? 0;
  const end = range.end.codePointAt(0) ?? 0;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/** Expand shorthand escape into CharRange array: \d -> [0-9], \w -> [a-zA-Z0-9_], \s -> [\t\n\r\x20] */
export const shorthandToRanges = (shorthand: string): ReadonlyArray<CharRange> => {
  const map: Record<string, ReadonlyArray<CharRange>> = {
    '\\d': [{ start: '0', end: '9' }],
    '\\w': [
      { start: 'a', end: 'z' },
      { start: 'A', end: 'Z' },
      { start: '0', end: '9' },
      { start: '_', end: '_' },
    ],
    '\\s': [
      { start: '\t', end: '\t' },
      { start: '\n', end: '\n' },
      { start: '\r', end: '\r' },
      { start: ' ', end: ' ' },
    ],
  };
  return map[shorthand] ?? [];
};

/** Get all printable ASCII char codes */
export const printableAsciiCodes = (): ReadonlyArray<number> =>
  Array.from({ length: PRINTABLE_ASCII_END - PRINTABLE_ASCII_START + 1 }, (_, i) => PRINTABLE_ASCII_START + i);

/** Expand a CharClassNode's ranges into a flat array of valid character codes. Handles negation. */
export const expandCharClass = (ranges: ReadonlyArray<CharRange>, negated: boolean): ReadonlyArray<number> => {
  const expanded = ranges.flatMap((range) => [...expandRange(range)]);

  if (!negated) {
    return expanded;
  }

  const excludeSet = new Set(expanded);
  return printableAsciiCodes().filter((code) => !excludeSet.has(code));
};
