import vue from '@vitejs/plugin-vue';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: true,
    exclude: [...configDefaults.exclude, '**/*.stories.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.stories.ts',
        'src/**/*.mdx',
        'src/**/__tests__/**',
        'src/**/*.spec.ts',
      ],
    },
  },
});
