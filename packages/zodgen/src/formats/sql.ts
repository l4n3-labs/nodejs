export type SQLOptions = {
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

export const toSQL = (rows: ReadonlyArray<Record<string, unknown>>, options: SQLOptions): string => {
  if (rows.length === 0) return '';
  const firstRow = rows[0];
  if (!firstRow) return '';
  const columns = Object.keys(firstRow);
  const columnList = columns.join(', ');
  const valueRows = rows.map((row) => `(${columns.map((c) => escapeSQL(row[c])).join(', ')})`);
  return `INSERT INTO ${options.table} (${columnList}) VALUES\n${valueRows.join(',\n')};`;
};
