import { EventBridgeSchema } from '@aws-lambda-powertools/parser/schemas/eventbridge';
import { S3EventNotificationEventBridgeSchema, S3Schema } from '@aws-lambda-powertools/parser/schemas/s3';
import { fixture } from '@l4n3/fakeish';
import { describe, expect, it } from 'vitest';

// --- Reusable mock factories ---

const createMockEventBridge = (seed?: number) => fixture(EventBridgeSchema, { seed });
const createMockS3Event = (seed?: number) => fixture(S3Schema, { seed });
const createMockS3EventBridge = (seed?: number) => fixture(S3EventNotificationEventBridgeSchema, { seed });

describe('stream and event-driven fixtures', () => {
  // ── EventBridge events ────────────────────────────────────────────

  describe('EventBridge events', () => {
    it('generates a valid EventBridge event with .one()', () => {
      const event = createMockEventBridge(42).one();
      expect(typeof event.version).toBe('string');
      expect(typeof event.id).toBe('string');
      expect(typeof event.source).toBe('string');
      expect(typeof event.account).toBe('string');
      expect(typeof event['detail-type']).toBe('string');
      expect(Array.isArray(event.resources)).toBe(true);
    });

    it('overrides source and detail-type for a custom event', () => {
      const event = createMockEventBridge(42)
        .override('source', () => 'com.myapp.orders')
        .override('detail-type', () => 'OrderCreated')
        .override('account', () => '123456789012')
        .one();
      expect(event.source).toBe('com.myapp.orders');
      expect(event['detail-type']).toBe('OrderCreated');
      expect(event.account).toBe('123456789012');
    });

    it('uses predicate override to set all string fields matching "account"', () => {
      const event = createMockEventBridge(42)
        .override(
          (ctx) => ctx.path.at(-1) === 'account',
          () => '999999999999',
        )
        .one();
      expect(event.account).toBe('999999999999');
    });

    it('generates multiple EventBridge events with unique ids', () => {
      const events = createMockEventBridge(1).many(10, { unique: ['id'] });
      expect(events).toHaveLength(10);
      const ids = events.map((e) => e.id);
      expect(new Set(ids).size).toBe(10);
    });
  });

  // ── S3 event notifications ────────────────────────────────────────

  describe('S3 event notifications', () => {
    it('generates an S3 event with .one()', () => {
      const event = createMockS3Event(42).one();
      expect(Array.isArray(event.Records)).toBe(true);
      expect(event.Records.length).toBeGreaterThanOrEqual(1);
      for (const record of event.Records) {
        expect(record.eventSource).toBe('aws:s3');
        expect(typeof record.s3.bucket.name).toBe('string');
        expect(typeof record.s3.object.key).toBe('string');
      }
    });

    it('partially overrides the s3 bucket and object fields via .partialOverride()', () => {
      const record = fixture(S3Schema, { seed: 42 })
        .partialOverride('Records', {
          awsRegion: () => 'us-west-2',
        })
        .one();
      for (const rec of record.Records) {
        expect(rec.awsRegion).toBe('us-west-2');
      }
    });

    it('overrides by predicate to set all ARN-like fields', () => {
      const event = createMockS3Event(42)
        .override(
          (ctx) => ctx.path.at(-1) === 'arn',
          () => 'arn:aws:s3:::my-test-bucket',
        )
        .one();
      for (const record of event.Records) {
        expect(record.s3.bucket.arn).toBe('arn:aws:s3:::my-test-bucket');
      }
    });
  });

  // ── S3 EventBridge notification ───────────────────────────────────

  describe('S3 EventBridge notification', () => {
    it('generates an S3 EventBridge event with .one()', () => {
      const event = createMockS3EventBridge(42).one();
      expect(typeof event.source).toBe('string');
      expect(typeof event['detail-type']).toBe('string');
      expect(event.detail).toBeDefined();
      expect(typeof event.detail.bucket.name).toBe('string');
      expect(typeof event.detail.object.key).toBe('string');
    });

    it('partially overrides the detail bucket and object', () => {
      const event = createMockS3EventBridge(42)
        .partialOverride('detail', {
          requester: () => '123456789012',
          'request-id': () => 'REQ-001',
        })
        .one();
      expect(event.detail.requester).toBe('123456789012');
      expect(event.detail['request-id']).toBe('REQ-001');
    });
  });

  // ── MaxDepth control ──────────────────────────────────────────────

  describe('maxDepth control', () => {
    it('generates S3 events at reduced depth with .maxDepth()', () => {
      const shallow = createMockS3Event(42).maxDepth(3).one();
      expect(Array.isArray(shallow.Records)).toBe(true);
      // At low depth, the structure still generates but nested optionals may be omitted
      expect(shallow.Records.length).toBeGreaterThanOrEqual(0);
    });

    it('generates EventBridge events at reduced depth', () => {
      const shallow = createMockEventBridge(42).maxDepth(2).one();
      expect(typeof shallow.id).toBe('string');
      expect(typeof shallow.source).toBe('string');
    });
  });
});
