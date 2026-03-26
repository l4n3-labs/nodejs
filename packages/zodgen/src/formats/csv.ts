const escapeCSVValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const toCSV = (rows: ReadonlyArray<Record<string, unknown>>): string => {
  if (rows.length === 0) return '';
  const firstRow = rows[0];
  if (!firstRow) return '';
  const headers = Object.keys(firstRow);
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) => headers.map((h) => escapeCSVValue(row[h])).join(','));
  return [headerLine, ...dataLines].join('\n');
};
