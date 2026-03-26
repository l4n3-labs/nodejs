import { createHash } from 'node:crypto';
import { SqsRecordSchema, SqsSchema } from '@aws-lambda-powertools/parser/schemas/sqs';
import { fixture } from '@l4n3/zodgen';

// Generate a basic SQS event from the AWS Powertools schema

const event = fixture(SqsSchema).one();
console.log('SQS event:', JSON.stringify(event, null, 2));

// Override individual record fields for realistic test data

const orderPayload = JSON.stringify({ orderId: 'ORD-12345', amount: 49.99, currency: 'USD' });

const recordGen = fixture(SqsRecordSchema, { seed: 42 })
  .override('body', () => orderPayload)
  .override('eventSourceARN', () => 'arn:aws:sqs:us-east-1:123456789012:OrderQueue')
  .override('awsRegion', () => 'us-east-1')
  .override('eventSource', () => 'aws:sqs');

const record = recordGen.one();
console.log('\nOverridden SQS record body:', record.body);
console.log('Event source ARN:', record.eventSourceARN);

// Derive md5OfBody from the generated body using Node crypto

const recordWithMd5 = fixture(SqsRecordSchema, { seed: 7 })
  .override('body', () => orderPayload)
  .derive('md5OfBody', (rec) => createHash('md5').update(rec.body).digest('hex'));

const derivedRecord = recordWithMd5.one();
console.log('\nDerived md5OfBody:', derivedRecord.md5OfBody);
console.log(
  'Matches actual md5?',
  derivedRecord.md5OfBody === createHash('md5').update(derivedRecord.body).digest('hex'),
);

// Batch generation — multiple SQS records for load testing

const records = fixture(SqsRecordSchema, { seed: 1 })
  .override('eventSourceARN', () => 'arn:aws:sqs:us-east-1:123456789012:OrderQueue')
  .many(5, { unique: ['messageId'] });

console.log('\n5 SQS records with unique messageIds:');
for (const rec of records) {
  console.log(`  ${rec.messageId} — body length: ${rec.body.length}`);
}
