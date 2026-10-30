import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores(['dist', 'api', 'scripts', 'legacy', 'modelo', 'node_modules', 'public']),
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Privacidade: transcricoes e audio nunca podem ir para o console.
      'no-console': 'error',
    },
  },
);
