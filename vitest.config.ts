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
        // Baseline: 98%+ lines, 100% functions, 90%+ branches (as of 0.2.0)
        lines: 90,
        functions: 95,
        branches: 85,
        statements: 90,
      },
    },
  },
});
