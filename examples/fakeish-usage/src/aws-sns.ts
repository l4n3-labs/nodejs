import { SnsRecordSchema, SnsSchema } from '@aws-lambda-powertools/parser/schemas/sns';
import { fixture } from '@l4n3/fakeish';

// Generate a basic SNS event from the AWS Powertools schema

const event = fixture(SnsSchema).one();
console.log('SNS event:', JSON.stringify(event, null, 2));

// Traits — define reusable presets for common SNS scenarios

const snsGen = fixture(SnsRecordSchema, { seed: 42 })
  .trait('notification', {
    EventSource: () => 'aws:sns',
    EventVersion: () => '1.0',
  })
  .trait('alarm', {
    EventSource: () => 'aws:sns',
  });

// Use the notification trait

const notification = snsGen.with('notification').one();
console.log('\nNotification event source:', notification.EventSource);
console.log('Notification version:', notification.EventVersion);

// Use the alarm trait with an additional override for the SNS message

const alarm = snsGen
  .with('alarm')
  .override(
    (ctx) => ctx.path.at(-1) === 'Message',
    () =>
      JSON.stringify({
        AlarmName: 'HighCPUAlarm',
        NewStateValue: 'ALARM',
        NewStateReason: 'Threshold crossed: CPU > 90% for 5 minutes',
        OldStateValue: 'OK',
      }),
  )
  .override(
    (ctx) => ctx.path.at(-1) === 'Subject',
    () => 'ALARM: "HighCPUAlarm" in US East (N. Virginia)',
  )
  .one();

console.log('\nAlarm SNS message:', alarm.Sns.Message);
console.log('Alarm subject:', alarm.Sns.Subject);

// Batch generation with traits

const notifications = snsGen.with('notification').many(3);
console.log('\n3 SNS notifications:');
for (const n of notifications) {
  console.log(`  ${n.Sns.MessageId} — subject: ${n.Sns.Subject}`);
}
