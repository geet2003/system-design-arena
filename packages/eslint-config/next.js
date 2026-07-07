/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    './index.js',
    'next/core-web-vitals',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
