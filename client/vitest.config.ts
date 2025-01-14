/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.ts',
    include: ['./src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/setupTests.ts',
        '**/*.d.ts',
        'src/types/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/test/mocks/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    },
    watch: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});