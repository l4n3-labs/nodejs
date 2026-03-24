import { describe, expect, it } from 'vitest';
import { applyTransforms, defaultConfig } from './config.js';
import { override } from './transforms/override.js';
import { withSeed } from './transforms/seed.js';

describe('defaultConfig', () => {
  it('has undefined seed and empty overrides', () => {
    expect(defaultConfig.seed).toBeUndefined();
    expect(defaultConfig.overrides).toEqual([]);
  });
});

describe('withSeed', () => {
  it('sets seed on config', () => {
    const config = applyTransforms([withSeed(42)]);
    expect(config.seed).toBe(42);
  });
});

describe('override', () => {
  it('adds string-matcher override to config', () => {
    const gen = () => 'test@example.com';
    const config = applyTransforms([override('email', gen)]);
    expect(config.overrides).toHaveLength(1);
    expect(config.overrides[0].matcher).toBe('email');
  });

  it('adds predicate-matcher override to config', () => {
    const matcher = () => true;
    const gen = () => 'value';
    const config = applyTransforms([override(matcher, gen)]);
    expect(config.overrides).toHaveLength(1);
    expect(typeof config.overrides[0].matcher).toBe('function');
  });
});

describe('applyTransforms', () => {
  it('composes multiple transforms in order', () => {
    const config = applyTransforms([withSeed(42), override('email', () => 'a@b.com'), override('name', () => 'Alice')]);
    expect(config.seed).toBe(42);
    expect(config.overrides).toHaveLength(2);
  });

  it('later seed overrides earlier seed', () => {
    const config = applyTransforms([withSeed(1), withSeed(2)]);
    expect(config.seed).toBe(2);
  });

  it('preserves override registration order', () => {
    const config = applyTransforms([override('a', () => 1), override('b', () => 2)]);
    expect(config.overrides[0].matcher).toBe('a');
    expect(config.overrides[1].matcher).toBe('b');
  });
});
