import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: process.env.NODE_ENV === 'production' ? '/l27-frame-grabber/' : '/',
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
      input: './index.html'
    }
  }
});