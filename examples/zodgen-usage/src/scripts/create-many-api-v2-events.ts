import { writeFile } from 'node:fs/promises';
import { APIGatewayProxyEventV2Schema } from '@aws-lambda-powertools/parser/schemas/api-gatewayv2';
import { fixture } from '@l4n3/zodgen';

const batchGen = fixture(APIGatewayProxyEventV2Schema, { seed: 1 })
  .override('routeKey', () => 'POST /api/orddders')
  .override('rawPath', () => '/api/orders')
  .derive('routeKey', ({ rawPath }) => `POST ${rawPath}`)
  .override('version', () => '2.0')
  .override('body', (ctx) => JSON.stringify({ orderId: `ORD-${String(ctx.sequence + 1).padStart(4, '0')}` }));

const batch = batchGen.many(10);
console.log('\n10 sequential API requests:');

const filename = 'events2.json';

await writeFile(filename, JSON.stringify(batch));
