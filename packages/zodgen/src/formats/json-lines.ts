/**
 * Converts an array of records to a newline-delimited JSON (JSON Lines) string.
 * Each record is serialized as a single JSON object per line.
 *
 * @param rows - The records to convert.
 * @returns A JSON Lines string with one JSON object per line.
 *
 * @example
 * ```ts
 * import { fixture } from '@l4n3/zodgen';
 * import { toJSONLines } from '@l4n3/zodgen/formats';
 *
 * const users = fixture(UserSchema).many(3);
 * const jsonl = toJSONLines(users);
 * // {"name":"Alice","age":28}
 * // {"name":"Bob","age":34}
 * // {"name":"Carol","age":22}
 * ```
 */
export const toJSONLines = (rows: ReadonlyArray<Record<string, unknown>>): string =>
  rows.map((row) => JSON.stringify(row)).join('\n');
