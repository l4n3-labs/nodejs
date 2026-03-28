const spacingScale = [0, 1, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

export const spacingTokens = Object.fromEntries(
  spacingScale.map((value) => [String(value), { $value: `${value}px`, $type: 'dimension' }]),
);

export default { spacing: spacingTokens };
