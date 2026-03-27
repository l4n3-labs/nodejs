import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import { APIGatewayProxyEventV2Schema } from '@aws-lambda-powertools/parser/schemas/api-gatewayv2';
import { fixture } from '@l4n3/fakeish';

// --- REST API (v1) ---

const restEvent = fixture(APIGatewayProxyEventSchema).one();
console.log('REST API event:', JSON.stringify(restEvent, null, 2));

// Override path, method, and headers for a realistic GET request

const restGen = fixture(APIGatewayProxyEventSchema, { seed: 42 })
  .override('path', () => '/api/users/123')
  .override('resource', () => '/api/users/{id}')
  .override('httpMethod', () => 'GET');

const getRequest = restGen.one();
console.log('\nREST GET path:', getRequest.path);
console.log('REST GET method:', getRequest.httpMethod);
console.log('REST resource:', getRequest.resource);

// --- HTTP API (v2) ---

const httpEvent = fixture(APIGatewayProxyEventV2Schema).one();
console.log('\nHTTP API event:', JSON.stringify(httpEvent, null, 2));

// Override route and path for HTTP API

const httpGen = fixture(APIGatewayProxyEventV2Schema, { seed: 42 })
  .override('routeKey', () => 'GET /api/items')
  .override('rawPath', () => '/api/items')
  .override('rawQueryString', () => 'category=books&page=1')
  .override('version', () => '2.0');

const httpRequest = httpGen.one();
console.log('\nHTTP API route:', httpRequest.routeKey);
console.log('HTTP API path:', httpRequest.rawPath);
console.log('HTTP API query:', httpRequest.rawQueryString);

// Sequences — generate batch requests with sequential IDs and monotonic timestamps

const batchGen = fixture(APIGatewayProxyEventV2Schema, { seed: 1 })
  .override('routeKey', () => 'POST /api/orders')
  .override('rawPath', () => '/api/orders')
  .override('version', () => '2.0')
  .override('body', (ctx) => JSON.stringify({ orderId: `ORD-${String(ctx.sequence + 1).padStart(4, '0')}` }));

const batch = batchGen.many(10);
console.log('\n10 sequential API requests:');
for (const req of batch) {
  const body = JSON.parse(req.body ?? '{}') as { orderId: string };
  console.log(`  ${req.routeKey} — ${body.orderId}`);
}

// REST API batch with sequential request IDs

const restBatchGen = fixture(APIGatewayProxyEventSchema, { seed: 5 })
  .override('path', () => '/api/products')
  .override('httpMethod', () => 'GET');

const restBatch = restBatchGen.many(5);
console.log('\n5 REST API requests:');
for (const req of restBatch) {
  console.log(`  ${req.httpMethod} ${req.path} — requestId: ${req.requestContext.requestId}`);
}
