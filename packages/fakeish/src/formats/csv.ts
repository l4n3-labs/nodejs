const escapeCSVValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Converts an array of records to a CSV string with proper escaping.
 * Uses the keys of the first row as column headers. Values containing
 * commas, quotes, or newlines are quoted and escaped.
 *
 * @param rows - The records to convert. All rows should have the same keys.
 * @returns A CSV string with headers on the first line, or an empty string if `rows` is empty.
 *
 * @example
 * ```ts
 * import { fixture } from '@l4n3/fakeish';
 * import { toCSV } from '@l4n3/fakeish/formats';
 *
 * const users = fixture(UserSchema).many(5);
 * const csv = toCSV(users);
 * // name,email,age
 * // Alice,alice@example.com,28
 * // ...
 * ```
 */
export const toCSV = (rows: ReadonlyArray<Record<string, unknown>>): string => {
  if (rows.length === 0) return '';
  const firstRow = rows[0];
  if (!firstRow) return '';
  const headers = Object.keys(firstRow);
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) => headers.map((h) => escapeCSVValue(row[h])).join(','));
  return [headerLine, ...dataLines].join('\n');
};
