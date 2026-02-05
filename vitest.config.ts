import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/types.ts',
        'src/**/index.ts',
      ],
      thresholds: {
        // Current baseline: 7.47% lines, 59.63% funcs, 69.56% branches
        // Increase thresholds as coverage improves
        lines: 5,
        functions: 50,
        branches: 50,
        statements: 5,
      },
    },
  },
});
