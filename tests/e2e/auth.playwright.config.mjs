import { defineConfig } from '@playwright/test';
import publicConfig from './playwright.config.mjs';

export default defineConfig({
  ...publicConfig,
  testDir: './auth',
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { ...publicConfig.use, baseURL: 'http://127.0.0.1:3101' },
  webServer: [
    publicConfig.webServer[0],
    {
      command: 'node support/auth-api-server.mjs',
      url: 'http://127.0.0.1:4101/health',
      reuseExistingServer: false,
    },
    {
      command: 'pnpm --filter @vavito/web exec next dev --hostname 127.0.0.1 --port 3101',
      url: 'http://127.0.0.1:3101',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        VAVITO_E2E: 'true',
        NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4101',
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:4101',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-e2e-not-a-secret',
      },
    },
  ],
});
