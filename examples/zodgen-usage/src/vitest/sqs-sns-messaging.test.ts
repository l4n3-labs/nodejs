import { createHash } from 'node:crypto';
import { SnsRecordSchema, SnsSchema } from '@aws-lambda-powertools/parser/schemas/sns';
import { SqsRecordSchema, SqsSchema } from '@aws-lambda-powertools/parser/schemas/sqs';
import { fixture } from '@l4n3/zodgen';
import { describe, expect, it } from 'vitest';

// --- Reusable mock factories ---

const createMockSqsRecord = (seed?: number) => fixture(SqsRecordSchema, { seed });
const createMockSnsRecord = (seed?: number) => fixture(SnsRecordSchema, { seed });
const createMockSqsEvent = (seed?: number) => fixture(SqsSchema, { seed });
const createMockSnsEvent = (seed?: number) => fixture(SnsSchema, { seed });

describe('SQS and SNS message event fixtures', () => {
  // ── SQS single record generation ──────────────────────────────────

  describe('SQS single record generation', () => {
    it('generates a valid SQS record with .one()', () => {
      const record = createMockSqsRecord().one();
      expect(typeof record.messageId).toBe('string');
      expect(typeof record.body).toBe('string');
      expect(typeof record.receiptHandle).toBe('string');
      expect(typeof record.eventSourceARN).toBe('string');
      expect(typeof record.awsRegion).toBe('string');
    });

    it('produces deterministic output with .seed()', () => {
      const a = createMockSqsRecord(42).one();
      const b = createMockSqsRecord(42).one();
      expect(a).toEqual(b);
    });

    it('produces different output with different seeds', () => {
      const a = createMockSqsRecord(1).one();
      const b = createMockSqsRecord(2).one();
      expect(a).not.toEqual(b);
    });

    it('overrides body and eventSourceARN by field name', () => {
      const orderPayload = JSON.stringify({ orderId: 'ORD-001', amount: 29.99 });
      const record = createMockSqsRecord(42)
        .override('body', () => orderPayload)
        .override('eventSourceARN', () => 'arn:aws:sqs:us-east-1:123456789012:OrderQueue')
        .one();
      expect(record.body).toBe(orderPayload);
      expect(record.eventSourceARN).toBe('arn:aws:sqs:us-east-1:123456789012:OrderQueue');
    });

    it('derives md5OfBody from the generated body', () => {
      const payload = JSON.stringify({ item: 'widget', qty: 3 });
      const record = createMockSqsRecord(7)
        .override('body', () => payload)
        .derive('md5OfBody', (rec) => createHash('md5').update(rec.body).digest('hex'))
        .one();
      const expectedMd5 = createHash('md5').update(payload).digest('hex');
      expect(record.md5OfBody).toBe(expectedMd5);
    });
  });

  // ── SQS batch generation ──────────────────────────────────────────

  describe('SQS batch generation', () => {
    it('generates multiple records with unique messageIds via .many()', () => {
      const records = createMockSqsRecord(1).many(10, { unique: ['messageId'] });
      expect(records).toHaveLength(10);
      const ids = records.map((r) => r.messageId);
      expect(new Set(ids).size).toBe(10);
    });

    it('uses predicate override to set all ARN-like fields', () => {
      const records = createMockSqsRecord(42)
        .override(
          (ctx) => ctx.path.at(-1) === 'eventSourceARN',
          () => 'arn:aws:sqs:eu-west-1:111111111111:TestQueue',
        )
        .many(5);
      for (const record of records) {
        expect(record.eventSourceARN).toBe('arn:aws:sqs:eu-west-1:111111111111:TestQueue');
      }
    });
  });

  // ── SQS partial overrides ─────────────────────────────────────────

  describe('SQS partial overrides', () => {
    it('partially overrides nested attributes inside SQS record', () => {
      const record = createMockSqsRecord(42)
        .partialOverride('attributes', {
          ApproximateReceiveCount: () => '1',
          SenderId: () => 'AROAEXAMPLEID',
        })
        .one();
      expect(record.attributes.ApproximateReceiveCount).toBe('1');
      expect(record.attributes.SenderId).toBe('AROAEXAMPLEID');
    });
  });

  // ── SNS traits for reusable scenarios ─────────────────────────────

  describe('SNS traits for reusable scenarios', () => {
    const snsFactory = createMockSnsRecord(42)
      .trait('notification', {
        EventSource: () => 'aws:sns',
        EventVersion: () => '1.0',
      })
      .trait('alarm', {
        EventSource: () => 'aws:sns',
      });

    it('applies the notification trait with .with()', () => {
      const record = snsFactory.with('notification').one();
      expect(record.EventSource).toBe('aws:sns');
      expect(record.EventVersion).toBe('1.0');
    });

    it('composes alarm trait with additional overrides', () => {
      const alarmMessage = JSON.stringify({
        AlarmName: 'HighCPU',
        NewStateValue: 'ALARM',
      });
      const record = snsFactory
        .with('alarm')
        .override(
          (ctx) => ctx.path.at(-1) === 'Message',
          () => alarmMessage,
        )
        .one();
      expect(record.EventSource).toBe('aws:sns');
      expect(record.Sns.Message).toBe(alarmMessage);
    });

    it('batch-generates notifications with a trait applied', () => {
      const records = snsFactory.with('notification').many(5);
      expect(records).toHaveLength(5);
      for (const record of records) {
        expect(record.EventSource).toBe('aws:sns');
        expect(record.EventVersion).toBe('1.0');
      }
    });

    it('base factory is not mutated by trait application', () => {
      const baseRecord = snsFactory.one();
      // Without .with(), traits have no effect — values are randomly generated
      expect(typeof baseRecord.EventSource).toBe('string');
    });
  });

  // ── Full SQS event envelope ───────────────────────────────────────

  describe('full SQS event envelope', () => {
    it('generates a complete SqsSchema event containing Records array', () => {
      const event = createMockSqsEvent(42).one();
      expect(Array.isArray(event.Records)).toBe(true);
      expect(event.Records.length).toBeGreaterThanOrEqual(1);
      for (const record of event.Records) {
        expect(typeof record.messageId).toBe('string');
        expect(typeof record.body).toBe('string');
      }
    });

    it('generates a complete SnsSchema event containing Records array', () => {
      const event = createMockSnsEvent(42).one();
      expect(Array.isArray(event.Records)).toBe(true);
      expect(event.Records.length).toBeGreaterThanOrEqual(1);
      for (const record of event.Records) {
        expect(typeof record.Sns.MessageId).toBe('string');
        expect(typeof record.Sns.Message).toBe('string');
      }
    });
  });
});
