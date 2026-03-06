import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: [
      'scripts/__tests__/**/*.test.js',
      'src/game/__tests__/**/*.test.js',
      'src/ui/__tests__/**/*.test.js',
    ],
    environmentMatchGlobs: [
      ['src/ui/__tests__/**', 'jsdom'],
    ],
  },
});
