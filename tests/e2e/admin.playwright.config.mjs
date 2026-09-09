import { defineConfig } from '@playwright/test';
import publicConfig from './playwright.config.mjs';

const apiUrl = 'http://127.0.0.1:4102';
const webUrl = 'http://127.0.0.1:3102';

export default defineConfig({
  ...publicConfig,
  expect: { timeout: 15_000 },
  projects: [
    {
      name: 'admin-desktop-chromium',
      use: { viewport: { height: 900, width: 1440 } },
    },
  ],
  testDir: './admin',
  timeout: 90_000,
  use: { ...publicConfig.use, baseURL: webUrl },
  webServer: [
    {
      command: 'node support/admin-api-server.mjs',
      reuseExistingServer: false,
      timeout: 30_000,
      url: `${apiUrl}/health`,
    },
    {
      command: 'pnpm --filter @vavito/web exec next dev --hostname 127.0.0.1 --port 3102',
      env: {
        ...process.env,
        VAVITO_E2E: 'true',
        NEXT_PUBLIC_API_URL: apiUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-admin-e2e-not-a-secret',
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:4102',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: webUrl,
    },
  ],
  workers: 1,
});
