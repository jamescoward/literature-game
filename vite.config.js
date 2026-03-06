import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  base: '/literature-game/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
