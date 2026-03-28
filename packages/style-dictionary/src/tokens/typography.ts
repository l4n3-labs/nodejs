export const typographyTokens = {
  fontFamily: {
    sans: { $value: "'Inter', system-ui, -apple-system, sans-serif", $type: 'fontFamily' },
    mono: { $value: "'JetBrains Mono', 'Fira Code', monospace", $type: 'fontFamily' },
  },
  fontSize: {
    xs: { $value: '12px', $type: 'dimension' },
    sm: { $value: '14px', $type: 'dimension' },
    md: { $value: '16px', $type: 'dimension' },
    lg: { $value: '18px', $type: 'dimension' },
    xl: { $value: '20px', $type: 'dimension' },
    '2xl': { $value: '24px', $type: 'dimension' },
    '3xl': { $value: '30px', $type: 'dimension' },
    '4xl': { $value: '36px', $type: 'dimension' },
  },
  fontWeight: {
    regular: { $value: '400', $type: 'fontWeight' },
    medium: { $value: '500', $type: 'fontWeight' },
    semibold: { $value: '600', $type: 'fontWeight' },
    bold: { $value: '700', $type: 'fontWeight' },
  },
  lineHeight: {
    tight: { $value: '1.25', $type: 'number' },
    normal: { $value: '1.5', $type: 'number' },
    relaxed: { $value: '1.75', $type: 'number' },
  },
};

export default { typography: typographyTokens };
