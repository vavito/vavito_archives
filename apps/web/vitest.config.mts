import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    include: ['test/{component,integration}/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    setupFiles: ['./test/helpers/vitest.setup.ts'],
  },
});
