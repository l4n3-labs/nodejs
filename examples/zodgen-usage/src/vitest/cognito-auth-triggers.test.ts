import {
  CustomMessageTriggerSchema,
  PostAuthenticationTriggerSchema,
  PreSignupTriggerSchema,
} from '@aws-lambda-powertools/parser/schemas/cognito';
import { de, ja } from '@faker-js/faker';
import { fixture } from '@l4n3/zodgen';
import { describe, expect, it } from 'vitest';

// --- Reusable mock factories ---

const createMockPreSignup = (seed?: number) => fixture(PreSignupTriggerSchema, { seed });
const createMockPostAuth = (seed?: number) => fixture(PostAuthenticationTriggerSchema, { seed });
const createMockCustomMessage = (seed?: number) => fixture(CustomMessageTriggerSchema, { seed });

describe('Cognito trigger event fixtures', () => {
  // ── Pre-signup trigger ────────────────────────────────────────────

  describe('pre-signup trigger', () => {
    it('generates a valid pre-signup event with .one()', () => {
      const event = createMockPreSignup().one();
      expect(typeof event.userPoolId).toBe('string');
      // userName is optional on all Cognito trigger schemas
      expect(event.userName === undefined || typeof event.userName === 'string').toBe(true);
      expect(typeof event.region).toBe('string');
      expect(typeof event.triggerSource).toBe('string');
      expect(event.request).toBeDefined();
      expect(event.response).toBeDefined();
    });

    it('overrides userPoolId, region, and userName', () => {
      const event = createMockPreSignup(42)
        .override('userPoolId', () => 'us-east-1_TestPool')
        .override('region', () => 'us-east-1')
        .override('userName', () => 'test-user-001')
        .one();
      expect(event.userPoolId).toBe('us-east-1_TestPool');
      expect(event.region).toBe('us-east-1');
      expect(event.userName).toBe('test-user-001');
    });

    it('seeded pre-signup events are identical', () => {
      const a = createMockPreSignup(42).one();
      const b = createMockPreSignup(42).one();
      expect(a).toEqual(b);
    });
  });

  // ── Schema switching with .for() ──────────────────────────────────

  describe('schema switching with .for()', () => {
    const sharedConfig = createMockPreSignup(42)
      .override('userPoolId', () => 'us-east-1_SharedPool')
      .override('region', () => 'us-east-1')
      .override('userName', () => 'shared-user');

    it('shares configuration across trigger types using .for()', () => {
      const preSignup = sharedConfig.one();
      const postAuth = sharedConfig.for(PostAuthenticationTriggerSchema).one();
      const customMsg = sharedConfig.for(CustomMessageTriggerSchema).one();

      // All three events share the overridden fields
      expect(preSignup.userPoolId).toBe('us-east-1_SharedPool');
      expect(postAuth.userPoolId).toBe('us-east-1_SharedPool');
      expect(customMsg.userPoolId).toBe('us-east-1_SharedPool');

      expect(preSignup.userName).toBe('shared-user');
      expect(postAuth.userName).toBe('shared-user');
      expect(customMsg.userName).toBe('shared-user');
    });

    it('carries overrides from PreSignup to PostAuthentication schema', () => {
      const postAuth = sharedConfig.for(PostAuthenticationTriggerSchema).one();
      expect(postAuth.region).toBe('us-east-1');
      expect(typeof postAuth.triggerSource).toBe('string');
    });

    it('carries overrides from PreSignup to CustomMessage schema', () => {
      const customMsg = sharedConfig.for(CustomMessageTriggerSchema).one();
      expect(customMsg.region).toBe('us-east-1');
      expect(typeof customMsg.triggerSource).toBe('string');
      expect(customMsg.request).toBeDefined();
    });
  });

  // ── Locale-aware generation ───────────────────────────────────────

  describe('locale-aware generation', () => {
    it('generates German locale user data with .locale()', () => {
      const germanEvent = createMockPreSignup(42).locale([de]).optionalRate(1.0).one();
      // Locale changes the generated string values (e.g., userName picks from German names)
      expect(typeof germanEvent.userName).toBe('string');
      expect(germanEvent.userName?.length).toBeGreaterThan(0);
    });

    it('generates Japanese locale user data via .locale()', () => {
      const japaneseEvent = createMockPreSignup(42).locale([ja]).optionalRate(1.0).one();
      expect(typeof japaneseEvent.userName).toBe('string');
      expect(japaneseEvent.userName?.length).toBeGreaterThan(0);
    });

    it('different locales produce different output for the same seed', () => {
      const german = createMockPreSignup(42).locale([de]).optionalRate(1.0).one();
      const japanese = createMockPreSignup(42).locale([ja]).optionalRate(1.0).one();
      // Locale affects semantic string generation — userName is detected semantically
      // At minimum, the overall event shape differs between locales
      expect(JSON.stringify(german)).not.toEqual(JSON.stringify(japanese));
    });
  });

  // ── Semantic field detection ──────────────────────────────────────

  describe('semantic field detection', () => {
    it('auto-detects userName field when present and generates a realistic value', () => {
      // Use optionalRate(1.0) to ensure optional fields are generated
      const event = fixture(PreSignupTriggerSchema, { seed: 42 }).optionalRate(1.0).one();
      expect(typeof event.userName).toBe('string');
      expect(event.userName?.length).toBeGreaterThan(0);
    });

    it('auto-detects region field and generates a string value', () => {
      const event = createMockPreSignup(42).one();
      expect(typeof event.region).toBe('string');
      expect(event.region.length).toBeGreaterThan(0);
    });
  });

  // ── Custom message trigger batch generation ───────────────────────

  describe('custom message trigger', () => {
    it('generates a custom message trigger with request payload', () => {
      const event = createMockCustomMessage(42).one();
      expect(event.request).toBeDefined();
      expect(event.response).toBeDefined();
      expect(typeof event.triggerSource).toBe('string');
    });

    it('batch-generates multiple trigger events', () => {
      const events = createMockCustomMessage(1).many(5);
      expect(events).toHaveLength(5);
      for (const event of events) {
        expect(typeof event.userName).toBe('string');
        expect(typeof event.userPoolId).toBe('string');
      }
    });

    it('batch-generates post-auth events', () => {
      const events = createMockPostAuth(10).many(3);
      expect(events).toHaveLength(3);
      for (const event of events) {
        expect(typeof event.triggerSource).toBe('string');
        // userName is optional on the Cognito base schema
        expect(event.userName === undefined || typeof event.userName === 'string').toBe(true);
      }
    });
  });
});
