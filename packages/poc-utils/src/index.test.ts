import { describe, expect, it } from 'vitest';
import { add } from './index.js';

describe('add', () => {
  it('adds two positive numbers', () => {
    expect(add(1, 2)).toBe(3);
  });

  it('adds negative numbers', () => {
    expect(add(-1, -2)).toBe(-3);
  });

  it('adds zero', () => {
    expect(add(5, 0)).toBe(5);
  });

  it('adds positive and negative numbers', () => {
    expect(add(10, -3)).toBe(7);
  });
});
