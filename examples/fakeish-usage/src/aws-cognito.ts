import {
  CustomMessageTriggerSchema,
  PostAuthenticationTriggerSchema,
  PreSignupTriggerSchema,
} from '@aws-lambda-powertools/parser/schemas/cognito';
import { fixture } from '@l4n3/fakeish';

// Generate a basic Cognito Pre-Signup trigger event

const preSignup = fixture(PreSignupTriggerSchema).one();
console.log('Pre-signup trigger:', JSON.stringify(preSignup, null, 2));

// Seeded generation for deterministic test snapshots

const seededGen = fixture(PreSignupTriggerSchema, { seed: 42 });
const snapshot1 = seededGen.one();
const snapshot2 = seededGen.one();
console.log('\nSeeded events are identical:', JSON.stringify(snapshot1) === JSON.stringify(snapshot2));

// Overrides for realistic user pool configuration

const preSignupGen = fixture(PreSignupTriggerSchema, { seed: 7 })
  .override('userPoolId', () => 'us-east-1_TestPool')
  .override('region', () => 'us-east-1')
  .override('userName', () => 'test-user-001');

const customPreSignup = preSignupGen.one();
console.log('\nPre-signup user pool:', customPreSignup.userPoolId);
console.log('Pre-signup user:', customPreSignup.userName);
console.log('Pre-signup trigger source:', customPreSignup.triggerSource);

// Post-authentication trigger — different schema, different trigger source

const postAuthGen = fixture(PostAuthenticationTriggerSchema, { seed: 1 })
  .override('userPoolId', () => 'us-east-1_TestPool')
  .override('userName', () => 'test-user-001')
  .override('region', () => 'us-east-1');

const postAuth = postAuthGen.one();
console.log('\nPost-auth user:', postAuth.userName);
console.log('Post-auth trigger source:', postAuth.triggerSource);

// Custom message trigger — useful for testing email/SMS customization

const customMsgGen = fixture(CustomMessageTriggerSchema, { seed: 3 })
  .override('userPoolId', () => 'us-east-1_TestPool')
  .override('region', () => 'us-east-1');

const customMsg = customMsgGen.one();
console.log('\nCustom message trigger source:', customMsg.triggerSource);
console.log('Custom message request:', JSON.stringify(customMsg.request, null, 2));

// Use .for() to reuse configuration across different trigger schemas.
// Configure once, then rebind to each trigger type.

const baseGen = fixture(PreSignupTriggerSchema, { seed: 42 })
  .override('userPoolId', () => 'us-east-1_TestPool')
  .override('region', () => 'us-east-1')
  .override('userName', () => 'shared-user');

const preSignupEvent = baseGen.one();
const postAuthEvent = baseGen.for(PostAuthenticationTriggerSchema).one();
const customMsgEvent = baseGen.for(CustomMessageTriggerSchema).one();

console.log('\nShared config across trigger types:');
console.log(`  Pre-signup:  ${preSignupEvent.triggerSource} — ${preSignupEvent.userName}`);
console.log(`  Post-auth:   ${postAuthEvent.triggerSource} — ${postAuthEvent.userName}`);
console.log(`  Custom msg:  ${customMsgEvent.triggerSource} — ${customMsgEvent.userName}`);

// Batch generation — multiple pre-signup events for testing

const preSignupBatch = fixture(PreSignupTriggerSchema, { seed: 10 })
  .override('userPoolId', () => 'us-east-1_TestPool')
  .override('region', () => 'us-east-1')
  .many(3);

console.log('\n3 Pre-signup events:');
for (const event of preSignupBatch) {
  console.log(`  ${event.userName} — ${event.triggerSource}`);
}
