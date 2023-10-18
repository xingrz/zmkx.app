import { defineConfig, splitVendorChunkPlugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import i18n from '@intlify/unplugin-vue-i18n/vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('./src'),
    },
  },
  plugins: [
    vue(),
    i18n({
      strictMessage: false,
    }),
    splitVendorChunkPlugin(),
  ],
});
