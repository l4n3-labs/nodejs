import { AlbSchema } from '@aws-lambda-powertools/parser/schemas/alb';
import { APIGatewayProxyEventV2Schema } from '@aws-lambda-powertools/parser/schemas/api-gatewayv2';
import { SqsRecordSchema } from '@aws-lambda-powertools/parser/schemas/sqs';
import { fixture } from '@l4n3/zodgen';
import { toCSV, toJSONLines, toSQL } from '@l4n3/zodgen/formats';
import { describe, expect, it } from 'vitest';

// --- Reusable mock factories ---

const createMockSqsRecord = (seed?: number) => fixture(SqsRecordSchema, { seed });
const createMockHttpEvent = (seed?: number) => fixture(APIGatewayProxyEventV2Schema, { seed });
const createMockAlbEvent = (seed?: number) => fixture(AlbSchema, { seed });

describe('output formats and validation testing', () => {
  // ── CSV output ────────────────────────────────────────────────────

  describe('CSV output', () => {
    it('exports SQS records to CSV format via toCSV()', () => {
      const records = createMockSqsRecord(42)
        .override('eventSource', () => 'aws:sqs')
        .many(3);
      // Extract a flat subset for CSV (CSV works best with flat objects)
      const rows = records.map((r) => ({
        messageId: r.messageId,
        body: r.body,
        awsRegion: r.awsRegion,
        eventSource: r.eventSource,
      }));
      const csv = toCSV(rows);
      const lines = csv.trim().split('\n');
      // First line is headers
      expect(lines[0]).toContain('messageId');
      expect(lines[0]).toContain('body');
      expect(lines[0]).toContain('awsRegion');
      // Data rows follow
      expect(lines).toHaveLength(4); // header + 3 data rows
    });

    it('uses ctx.sequence for sequential messageIds in CSV export', () => {
      const records = createMockSqsRecord(42)
        .override('messageId', (ctx) => `MSG-${String(ctx.sequence + 1).padStart(3, '0')}`)
        .many(3);
      const rows = records.map((r) => ({ messageId: r.messageId, body: r.body }));
      const csv = toCSV(rows);
      expect(csv).toContain('MSG-001');
      expect(csv).toContain('MSG-002');
      expect(csv).toContain('MSG-003');
    });
  });

  // ── SQL output ────────────────────────────────────────────────────

  describe('SQL output', () => {
    it('exports API Gateway v2 events to SQL INSERT statements via toSQL()', () => {
      const events = createMockHttpEvent(42)
        .override('version', () => '2.0')
        .override('routeKey', () => 'GET /api/items')
        .many(3);
      const rows = events.map((e) => ({
        version: e.version,
        routeKey: e.routeKey,
        rawPath: e.rawPath,
      }));
      const sql = toSQL(rows, { table: 'api_events' });
      expect(sql).toContain('INSERT INTO api_events');
      expect(sql).toContain('GET /api/items');
      // toSQL generates a single INSERT with multiple value rows
      expect(sql).toMatch(/^INSERT INTO api_events/);
      // Should have 3 value rows (one per event)
      const valueRowCount = (sql.match(/\(/g) ?? []).length - 1; // subtract the column list parens
      expect(valueRowCount).toBeGreaterThanOrEqual(3);
    });
  });

  // ── JSON Lines output ─────────────────────────────────────────────

  describe('JSON Lines output', () => {
    it('exports SQS records to newline-delimited JSON via toJSONLines()', () => {
      const records = createMockSqsRecord(42).many(3);
      const rows = records.map((r) => ({
        messageId: r.messageId,
        body: r.body,
        awsRegion: r.awsRegion,
      }));
      const jsonl = toJSONLines(rows);
      const lines = jsonl.trim().split('\n');
      expect(lines).toHaveLength(3);
      // Each line should be valid JSON
      for (const line of lines) {
        const parsed = JSON.parse(line) as { messageId: string };
        expect(typeof parsed.messageId).toBe('string');
      }
    });
  });

  // ── Derived fields in exports ─────────────────────────────────────

  describe('derived fields in exports', () => {
    it('derives routeKey from rawPath before exporting', () => {
      const events = createMockHttpEvent(42)
        .override('rawPath', () => '/api/orders')
        .derive('routeKey', (e) => `GET ${e.rawPath}`)
        .many(3);
      const rows = events.map((e) => ({ routeKey: e.routeKey, rawPath: e.rawPath }));
      const csv = toCSV(rows);
      expect(csv).toContain('GET /api/orders');
      for (const event of events) {
        expect(event.routeKey).toBe('GET /api/orders');
      }
    });
  });

  // ── Invalid data generation ───────────────────────────────────────

  describe('invalid data generation for negative testing', () => {
    it('generates a single invalid ALB event with .invalid()', () => {
      const badEvent = createMockAlbEvent(42).invalid();
      const result = AlbSchema.safeParse(badEvent);
      expect(result.success).toBe(false);
    });

    it('verifies invalid events fail schema validation', () => {
      const badEvent = createMockHttpEvent(42).invalid();
      const result = APIGatewayProxyEventV2Schema.safeParse(badEvent);
      expect(result.success).toBe(false);
    });

    it('batch-generates invalid events with .invalidMany()', () => {
      const badEvents = createMockAlbEvent(42).invalidMany(10);
      expect(badEvents).toHaveLength(10);
      // Most generated invalid events should fail validation
      const failCount = badEvents.filter((e) => !AlbSchema.safeParse(e).success).length;
      expect(failCount).toBeGreaterThan(0);
    });

    it('uses seeded .invalid() for reproducible negative test data', () => {
      const a = createMockAlbEvent(42).invalid();
      const b = createMockAlbEvent(42).invalid();
      expect(a).toEqual(b);
    });
  });

  // ── Override with sequence for bulk data ───────────────────────────

  describe('override with sequence for bulk test data', () => {
    it('generates sequentially numbered records using ctx.sequence', () => {
      const records = createMockSqsRecord(42)
        .override('messageId', (ctx) => `msg-${ctx.sequence}`)
        .override('body', (ctx) => JSON.stringify({ index: ctx.sequence, item: `item-${ctx.sequence}` }))
        .many(5);
      for (const [i, record] of records.entries()) {
        expect(record.messageId).toBe(`msg-${i}`);
        const body = JSON.parse(record.body) as { index: number; item: string };
        expect(body.index).toBe(i);
        expect(body.item).toBe(`item-${i}`);
      }
    });
  });
});
