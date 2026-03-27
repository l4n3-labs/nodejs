import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import { APIGatewayProxyEventV2Schema } from '@aws-lambda-powertools/parser/schemas/api-gatewayv2';
import { LambdaFunctionUrlSchema } from '@aws-lambda-powertools/parser/schemas/lambda';
import { fixture } from '@l4n3/fakeish';
import { describe, expect, it } from 'vitest';

// --- Reusable mock factories ---

const createMockRestEvent = (seed?: number) => fixture(APIGatewayProxyEventSchema, { seed });
const createMockHttpEvent = (seed?: number) => fixture(APIGatewayProxyEventV2Schema, { seed });
const createMockFunctionUrlEvent = (seed?: number) => fixture(LambdaFunctionUrlSchema, { seed });

describe('API Gateway event fixtures', () => {
  // ── REST API v1 basics ────────────────────────────────────────────

  describe('REST API v1 basics', () => {
    it('generates a valid API Gateway v1 event with .one()', () => {
      const event = createMockRestEvent().one();
      expect(typeof event.path).toBe('string');
      expect(typeof event.httpMethod).toBe('string');
      expect(typeof event.resource).toBe('string');
      expect(event.requestContext).toBeDefined();
    });

    it('overrides path, httpMethod, and resource for a GET request', () => {
      const event = createMockRestEvent(42)
        .override('path', () => '/api/users/123')
        .override('httpMethod', () => 'GET')
        .override('resource', () => '/api/users/{id}')
        .one();
      expect(event.path).toBe('/api/users/123');
      expect(event.httpMethod).toBe('GET');
      expect(event.resource).toBe('/api/users/{id}');
    });

    it('seeded generation is deterministic across runs', () => {
      const a = createMockRestEvent(99).one();
      const b = createMockRestEvent(99).one();
      expect(a).toEqual(b);
    });

    it('seed via .seed() method matches seed via options', () => {
      const viaOptions = fixture(APIGatewayProxyEventSchema, { seed: 55 }).one();
      const viaMethod = fixture(APIGatewayProxyEventSchema).seed(55).one();
      expect(viaOptions).toEqual(viaMethod);
    });
  });

  // ── HTTP API v2 with sequences ────────────────────────────────────

  describe('HTTP API v2 with sequences', () => {
    it('generates sequential request bodies using ctx.sequence in .many()', () => {
      const events = createMockHttpEvent(1)
        .override('routeKey', () => 'POST /api/orders')
        .override('rawPath', () => '/api/orders')
        .override('body', (ctx) => JSON.stringify({ orderId: `ORD-${String(ctx.sequence + 1).padStart(4, '0')}` }))
        .many(5);

      expect(events).toHaveLength(5);
      const orderIds = events.map((e) => (JSON.parse(e.body ?? '{}') as { orderId: string }).orderId);
      expect(orderIds).toEqual(['ORD-0001', 'ORD-0002', 'ORD-0003', 'ORD-0004', 'ORD-0005']);
    });

    it('overrides routeKey, rawPath, and version for HTTP API', () => {
      const event = createMockHttpEvent(42)
        .override('routeKey', () => 'GET /api/items')
        .override('rawPath', () => '/api/items')
        .override('version', () => '2.0')
        .one();
      expect(event.routeKey).toBe('GET /api/items');
      expect(event.rawPath).toBe('/api/items');
      expect(event.version).toBe('2.0');
    });
  });

  // ── Custom generators ─────────────────────────────────────────────

  describe('custom generators', () => {
    it('replaces the string generator to produce predictable values via .generator()', () => {
      const event = fixture(APIGatewayProxyEventSchema)
        .generator('string', (ctx) => `test-${ctx.path.at(-1)}`)
        .one();
      // Custom string generator applies to plain string fields (not enums or literals)
      expect(event.path).toBe('test-path');
      expect(event.resource).toBe('test-resource');
      expect(typeof event.httpMethod).toBe('string');
    });
  });

  // ── Optional and null rate control ────────────────────────────────

  describe('optional and null rate control', () => {
    it('generates events with all optional fields present via .optionalRate(1.0)', () => {
      const events = fixture(APIGatewayProxyEventV2Schema, { seed: 42 }).optionalRate(1.0).many(10);
      for (const event of events) {
        // With optionalRate 1.0, optional fields like cookies should be present
        expect(event.cookies).toBeDefined();
      }
    });

    it('generates sparse events with most optionals missing via .optionalRate(0.0)', () => {
      const events = fixture(APIGatewayProxyEventV2Schema, { seed: 42 }).optionalRate(0.0).many(10);
      for (const event of events) {
        // With optionalRate 0.0, optional fields should be undefined
        expect(event.cookies).toBeUndefined();
      }
    });

    it('controls nullable field behavior via .nullRate()', () => {
      // nullRate(1.0) — all nullable fields should be null
      const allNull = fixture(APIGatewayProxyEventSchema, { seed: 42 }).nullRate(1.0).many(10);
      for (const event of allNull) {
        expect(event.body).toBeNull();
      }

      // nullRate(0.0) — no nullable fields should be null
      const noneNull = fixture(APIGatewayProxyEventSchema, { seed: 42 }).nullRate(0.0).many(10);
      for (const event of noneNull) {
        expect(event.body).not.toBeNull();
      }
    });
  });

  // ── Lambda Function URL events ────────────────────────────────────

  describe('Lambda Function URL events', () => {
    it('generates a Function URL event', () => {
      const event = createMockFunctionUrlEvent(42).one();
      expect(typeof event.version).toBe('string');
      expect(typeof event.rawPath).toBe('string');
      expect(typeof event.rawQueryString).toBe('string');
      expect(event.requestContext).toBeDefined();
      expect(typeof event.isBase64Encoded).toBe('boolean');
    });

    it('overrides Function URL fields for a realistic POST request', () => {
      const event = createMockFunctionUrlEvent(42)
        .override('rawPath', () => '/webhook')
        .override('rawQueryString', () => '')
        .override('body', () => JSON.stringify({ event: 'payment.completed' }))
        .override('isBase64Encoded', () => false)
        .one();
      expect(event.rawPath).toBe('/webhook');
      expect(event.rawQueryString).toBe('');
      expect(event.body).toBe(JSON.stringify({ event: 'payment.completed' }));
      expect(event.isBase64Encoded).toBe(false);
    });
  });
});
