import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 30000,
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@schema': path.resolve(__dirname, '../backend/schema.ts'),
    },
  },
});

