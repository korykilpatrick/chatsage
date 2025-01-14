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
        'src/test/mocks/**',
        // Exclude purely presentational components
        'src/components/ui/**',
        // Exclude development utilities
        'src/lib/dev-tools/**',
      ],
      all: true,
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    watch: {
      onStart: () => {
        console.log('\nStarting tests in watch mode...');
      },
      onTrigger: (trigger) => {
        console.log(`\nTest triggered by changes in: ${trigger}`);
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});