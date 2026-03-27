/**
 * Options for the {@link toSQL} format function.
 */
export type SQLOptions = {
  /** The target SQL table name for the INSERT statement. */
  readonly table: string;
};

const escapeSQL = (value: unknown): string => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
};

/**
 * Converts an array of records to a SQL INSERT statement.
 * Handles escaping for strings, nulls, booleans, numbers, bigints, and dates.
 *
 * @param rows - The records to convert. All rows should have the same keys.
 * @param options - Configuration including the target table name.
 * @returns A SQL INSERT statement string, or an empty string if `rows` is empty.
 *
 * @example
 * ```ts
 * import { fixture } from '@l4n3/fakeish';
 * import { toSQL } from '@l4n3/fakeish/formats';
 *
 * const users = fixture(UserSchema).many(3);
 * const sql = toSQL(users, { table: 'users' });
 * // INSERT INTO users (name, email, age) VALUES
 * // ('Alice', 'alice@example.com', 28),
 * // ('Bob', 'bob@example.com', 34),
 * // ('Carol', 'carol@example.com', 22);
 * ```
 */
export const toSQL = (rows: ReadonlyArray<Record<string, unknown>>, options: SQLOptions): string => {
  if (rows.length === 0) return '';
  const firstRow = rows[0];
  if (!firstRow) return '';
  const columns = Object.keys(firstRow);
  const columnList = columns.join(', ');
  const valueRows = rows.map((row) => `(${columns.map((c) => escapeSQL(row[c])).join(', ')})`);
  return `INSERT INTO ${options.table} (${columnList}) VALUES\n${valueRows.join(',\n')};`;
};
