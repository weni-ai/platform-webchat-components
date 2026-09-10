import { globalIgnores } from 'eslint/config';
import pluginVitest from '@vitest/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';
import weniConfig from '@weni/eslint-config/vue3.js';
import globals from 'globals';

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,ts,mts,vue}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/storybook-static/**',
    '**/node_modules/**',
    '**/.changeset/**',
    '**/*.min.js',
  ]),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/**/*', 'src/**/*.spec.ts'],
  },

  weniConfig,

  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  {
    name: 'app/presentational-core',
    files: ['src/components/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@weni/webchat-service',
              message:
                'Components must not import @weni/webchat-service. Principle II: the service is reachable only through the ./composables entry point.',
            },
          ],
          patterns: [
            {
              group: ['@weni/webchat-service/*'],
              message:
                'Components must not import @weni/webchat-service. Principle II: the service is reachable only through the ./composables entry point.',
            },
          ],
        },
      ],
    },
  },
);
