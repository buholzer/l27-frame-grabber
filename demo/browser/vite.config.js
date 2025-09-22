import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3009,
    host: true
  },
  resolve: {
    alias: {
      '@': '../../src'
    }
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});