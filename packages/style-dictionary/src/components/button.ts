export const buttonTokens = {
  background: {
    primary: { $value: '{color.blue.100}' },
    'primary-hover': { $value: '{color.blue.120}' },
    secondary: { $value: '{color.grey.20}' },
    'secondary-hover': { $value: '{color.grey.40}' },
    danger: { $value: '{color.red.100}' },
    'danger-hover': { $value: '{color.red.120}' },
  },
  text: {
    primary: { $value: '{color.grey.20}' },
    secondary: { $value: '{color.grey.140}' },
    danger: { $value: '{color.grey.20}' },
  },
  borderRadius: {
    $value: '6px',
    $type: 'dimension',
  },
  padding: {
    horizontal: { $value: '{spacing.16}' },
    vertical: { $value: '{spacing.8}' },
  },
};

export default { component: { button: buttonTokens } };
