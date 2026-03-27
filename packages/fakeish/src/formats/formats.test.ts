import { describe, expect, it } from 'vitest';
import { toCSV } from './csv.js';
import { toJSONLines } from './json-lines.js';
import { toSQL } from './sql.js';

describe('toCSV', () => {
  it('generates header row from object keys', () => {
    const result = toCSV([{ name: 'Alice', age: 30 }]);
    expect(result).toBe('name,age\nAlice,30');
  });

  it('escapes values with commas', () => {
    const result = toCSV([{ note: 'hello, world' }]);
    expect(result).toBe('note\n"hello, world"');
  });

  it('escapes values with quotes', () => {
    const result = toCSV([{ note: 'say "hi"' }]);
    expect(result).toBe('note\n"say ""hi"""');
  });

  it('escapes values with newlines', () => {
    const result = toCSV([{ note: 'line1\nline2' }]);
    expect(result).toBe('note\n"line1\nline2"');
  });

  it('handles null/undefined as empty string', () => {
    const result = toCSV([{ a: null, b: undefined }]);
    expect(result).toBe('a,b\n,');
  });

  it('handles dates as ISO strings', () => {
    const date = new Date('2026-01-15T10:30:00.000Z');
    const result = toCSV([{ created: date }]);
    expect(result).toBe('created\n2026-01-15T10:30:00.000Z');
  });

  it('handles numbers and booleans', () => {
    const result = toCSV([{ count: 42, active: true }]);
    expect(result).toBe('count,active\n42,true');
  });

  it('returns empty string for empty array', () => {
    expect(toCSV([])).toBe('');
  });

  it('handles multiple rows', () => {
    const result = toCSV([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    expect(result).toBe('id,name\n1,Alice\n2,Bob');
  });
});

describe('toSQL', () => {
  it('generates valid INSERT INTO statement', () => {
    const result = toSQL([{ id: 1, name: 'Alice' }], { table: 'users' });
    expect(result).toBe("INSERT INTO users (id, name) VALUES\n(1, 'Alice');");
  });

  it('escapes single quotes in string values', () => {
    const result = toSQL([{ name: "O'Brien" }], { table: 'users' });
    expect(result).toBe("INSERT INTO users (name) VALUES\n('O''Brien');");
  });

  it('handles null as SQL NULL', () => {
    const result = toSQL([{ name: null }], { table: 'users' });
    expect(result).toBe('INSERT INTO users (name) VALUES\n(NULL);');
  });

  it('handles numbers without quotes', () => {
    const result = toSQL([{ age: 30 }], { table: 'users' });
    expect(result).toBe('INSERT INTO users (age) VALUES\n(30);');
  });

  it('handles booleans as TRUE/FALSE', () => {
    const result = toSQL([{ active: true, deleted: false }], { table: 'users' });
    expect(result).toBe('INSERT INTO users (active, deleted) VALUES\n(TRUE, FALSE);');
  });

  it('handles dates as ISO strings in quotes', () => {
    const date = new Date('2026-01-15T10:30:00.000Z');
    const result = toSQL([{ created: date }], { table: 'events' });
    expect(result).toBe("INSERT INTO events (created) VALUES\n('2026-01-15T10:30:00.000Z');");
  });

  it('batches multiple rows into multi-row INSERT', () => {
    const result = toSQL(
      [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
      { table: 'users' },
    );
    expect(result).toBe("INSERT INTO users (id, name) VALUES\n(1, 'Alice'),\n(2, 'Bob');");
  });

  it('returns empty string for empty array', () => {
    expect(toSQL([], { table: 'users' })).toBe('');
  });
});

describe('toJSONLines', () => {
  it('generates one JSON object per line', () => {
    const result = toJSONLines([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    expect(result).toBe('{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}');
  });

  it('handles nested objects', () => {
    const result = toJSONLines([{ user: { name: 'Alice' } }]);
    expect(result).toBe('{"user":{"name":"Alice"}}');
  });

  it('returns empty string for empty array', () => {
    expect(toJSONLines([])).toBe('');
  });
});
