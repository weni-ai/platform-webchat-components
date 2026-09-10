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
    '**/coverage/**',
    '**/storybook-static/**',
    '**/node_modules/**',
    '**/.changeset/**',
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
);
