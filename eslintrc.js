module.exports = {
    root : true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      tsconfigRootDir: __dirname,
      project: ['./tsconfig.json'],
    },
    env: {
      node: true,
      es6: true,
    },
    plugins: ['@typescript-eslint'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    rules: {
      'prefer-const': 'warn', // Example: set the prefer-const rule as a warning
      '@typescript-eslint/no-this-alias': 'off', // Example: disable no-this-alias rule
      '@typescript-eslint/no-unused-vars' : 'warn',
      // '*' : 'warn'
    },
  };
  