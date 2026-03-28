import tinycolor from 'tinycolor2';

type BaseColor = { h: number; s: number; v: number };

const baseColors: Record<string, BaseColor> = {
  red: { h: 4, s: 62, v: 90 },
  purple: { h: 262, s: 47, v: 65 },
  blue: { h: 206, s: 70, v: 85 },
  teal: { h: 178, s: 75, v: 80 },
  green: { h: 119, s: 47, v: 73 },
  yellow: { h: 45, s: 70, v: 95 },
  orange: { h: 28, s: 76, v: 98 },
  grey: { h: 240, s: 14, v: 35 },
};

type ColorShade = { $value: string };

type ColorRamp = Record<string, ColorShade>;

export const generateColorRamp = (base: BaseColor): ColorRamp => ({
  '20': { $value: tinycolor(base).lighten(30).toHexString() },
  '40': { $value: tinycolor(base).lighten(25).toHexString() },
  '60': { $value: tinycolor(base).lighten(20).toHexString() },
  '80': { $value: tinycolor(base).lighten(10).toHexString() },
  '100': { $value: tinycolor(base).toHexString() },
  '120': { $value: tinycolor(base).darken(10).toHexString() },
  '140': { $value: tinycolor(base).darken(20).toHexString() },
});

export const colorTokens = Object.fromEntries(
  Object.entries(baseColors).map(([name, base]) => [name, generateColorRamp(base)]),
);

export default { color: colorTokens };
