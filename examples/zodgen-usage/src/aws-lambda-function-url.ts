import { LambdaFunctionUrlSchema } from '@aws-lambda-powertools/parser/schemas/lambda';
import { fixture } from '@l4n3/zodgen';

// Generate a basic Lambda Function URL event (extends API Gateway v2 format)

const event = fixture(LambdaFunctionUrlSchema).one();
console.log('Lambda Function URL event:', JSON.stringify(event, null, 2));

// Traits for common request patterns

const urlGen = fixture(LambdaFunctionUrlSchema, { seed: 42 })
  .trait('getRequest', {
    rawPath: () => '/api/users',
    rawQueryString: () => 'page=1&limit=10',
    isBase64Encoded: () => false,
  })
  .trait('postRequest', {
    rawPath: () => '/api/users',
    body: () => JSON.stringify({ name: 'Jane Doe', email: 'jane@example.com' }),
    isBase64Encoded: () => false,
  });

// GET request

const getEvent = urlGen.with('getRequest').one();
console.log('\nGET request path:', getEvent.rawPath);
console.log('Query string:', getEvent.rawQueryString);

// POST request with JSON body

const postEvent = urlGen.with('postRequest').one();
console.log('\nPOST request path:', postEvent.rawPath);
console.log('Body:', postEvent.body);

// Compose traits with additional overrides

const customEvent = urlGen
  .with('getRequest')
  .override('version', () => '2.0')
  .override('routeKey', () => '$default')
  .one();

console.log('\nCustom event version:', customEvent.version);
console.log('Route key:', customEvent.routeKey);
console.log('Path:', customEvent.rawPath);

// Batch generation for multiple function URL invocations

const events = urlGen.with('getRequest').many(3);
console.log('\n3 Lambda Function URL events:');
for (const e of events) {
  console.log(`  ${e.rawPath} — query: ${e.rawQueryString}`);
}
