import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const peers = ['vue', '@weni/unnnic-system', '@weni/webchat-service'] as const;

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        'composables/index': fileURLToPath(
          new URL('./src/composables/index.ts', import.meta.url),
        ),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: (id) =>
        peers.some((peer) => id === peer || id.startsWith(`${peer}/`)),
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((name) => name.endsWith('.css'))) {
            return 'style.css';
          }

          return assetInfo.names?.[0] ?? 'asset';
        },
      },
    },
  },
});
