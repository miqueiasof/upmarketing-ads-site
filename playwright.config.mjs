import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testIgnore: /smoke-prod/,
  timeout: 30_000,
  retries: 0,
  use: { baseURL: 'http://localhost:8080' },
  webServer: {
    command: 'npx eleventy --serve --port=8080',
    url: 'http://localhost:8080/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
