module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'off',
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
  overrides: [
    {
      files: ['__tests__/**/*', 'jest.setup.js'],
      env: {
        jest: true,
      },
    },
  ],
};
