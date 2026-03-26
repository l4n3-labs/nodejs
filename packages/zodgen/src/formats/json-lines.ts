export const toJSONLines = (rows: ReadonlyArray<Record<string, unknown>>): string =>
  rows.map((row) => JSON.stringify(row)).join('\n');
