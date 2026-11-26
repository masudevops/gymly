import { defineConfig, devices } from '@playwright/test';

// E2E tests run against a production-style web build (static export served as an SPA) and the
// LOCAL Supabase stack (`npx supabase start`). Locally: `npm run e2e`. CI: .github/workflows/ci.yml.
const PORT = 8081; // must match the local Supabase auth site_url / redirect allow-list

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // tests share one local database; keep them independent but serial
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } }],
  webServer: {
    // Reuses a running dev server locally (`npm run web` on 8081); otherwise builds and serves dist/.
    command: `npx expo export --platform web && npx serve -s dist -l ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
