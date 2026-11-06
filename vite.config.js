import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        qrcode: resolve(__dirname, 'qrcode.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
