import { defineConfig } from 'playwright/test';

// Smoke tests against the live site. No local server; the default config ignores this spec.
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /smoke-prod/,
  timeout: 60_000,
  retries: 1,
  use: { baseURL: 'https://upmarketingads.com' },
});
