import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }]
    }
  }
];
