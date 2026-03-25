import { describe, expect, it } from 'vitest';
import { colorTokens, generateColorRamp } from './color.js';

describe('generateColorRamp', () => {
  it('produces 7 shades', () => {
    const ramp = generateColorRamp({ h: 206, s: 70, v: 85 });
    expect(Object.keys(ramp)).toEqual(['20', '40', '60', '80', '100', '120', '140']);
  });

  it('produces valid hex color strings', () => {
    const ramp = generateColorRamp({ h: 206, s: 70, v: 85 });
    const hexPattern = /^#[0-9a-f]{6}$/;
    for (const shade of Object.values(ramp)) {
      expect(shade.$value).toMatch(hexPattern);
    }
  });

  it('produces lighter shades at lower numbers and darker at higher', () => {
    const ramp = generateColorRamp({ h: 206, s: 70, v: 85 });
    const shade20 = Number.parseInt(ramp['20'].$value.slice(1), 16);
    const shade100 = Number.parseInt(ramp['100'].$value.slice(1), 16);
    const shade140 = Number.parseInt(ramp['140'].$value.slice(1), 16);
    // Lighter colors have higher hex values on average
    expect(shade20).toBeGreaterThan(shade100);
    expect(shade100).toBeGreaterThan(shade140);
  });
});

describe('colorTokens', () => {
  it('generates ramps for all base colors', () => {
    const expectedColors = ['red', 'purple', 'blue', 'teal', 'green', 'yellow', 'orange', 'grey'];
    expect(Object.keys(colorTokens)).toEqual(expectedColors);
  });

  it('each color has 7 shades', () => {
    for (const ramp of Object.values(colorTokens)) {
      expect(Object.keys(ramp)).toHaveLength(7);
    }
  });
});
