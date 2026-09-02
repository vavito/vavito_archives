import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const environmentBoundaryStub = fileURLToPath(
  new URL('./test/helpers/environment-boundary.ts', import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'client-only': environmentBoundaryStub,
      'server-only': environmentBoundaryStub,
    },
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    include: ['test/{component,integration}/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    setupFiles: ['./test/helpers/vitest.setup.ts'],
  },
});
