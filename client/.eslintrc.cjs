/* eslint config — see "Enforced by lint" in CLAUDE.md */
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs', 'postcss.config.js', 'vite.config.ts', 'tailwind.config.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // Hard rule #1
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@/features/*/*'], message: 'Cross-team imports go through @/features/<team> only.' },
        { group: ['**/internal/**'], message: 'internal/ is private to its team.' },
      ],
    }],
  },
  overrides: [
    {
      // Hard rule #6
      files: ['src/features/*/index.ts', 'src/types/events.ts', 'src/map/layerRegistry.ts'],
      rules: { '@typescript-eslint/explicit-module-boundary-types': 'error' },
    },
  ],
};
