import { defineConfig, devices } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:4100';
const webUrl = 'http://127.0.0.1:3100';

export default defineConfig({
  expect: { timeout: 5_000 },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: 'test-results',
  projects: [
    {
      name: 'desktop-chromium',
      use: { viewport: { height: 900, width: 1440 } },
    },
    {
      name: 'mobile-chromium',
      use: {
        hasTouch: true,
        isMobile: true,
        viewport: { height: 844, width: 390 },
      },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'], browserName: 'webkit' },
    },
  ],
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './public',
  timeout: 30_000,
  use: {
    baseURL: webUrl,
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node support/public-api-server.mjs',
      reuseExistingServer: false,
      timeout: 30_000,
      url: `${apiUrl}/health`,
    },
    {
      command: 'pnpm --filter @vavito/web exec next dev --hostname 127.0.0.1 --port 3100',
      env: {
        ...process.env,
        VAVITO_E2E: 'true',
        NEXT_PUBLIC_API_URL: apiUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'e2e-publishable-key',
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: webUrl,
    },
  ],
  workers: 2,
});
