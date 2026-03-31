// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false, // Run tests sequentially to avoid API rate limiting
  forbidOnly: !!process.env.CI,
  retries: 0, // Disable retries to finish faster
  // workers: 1, // Single worker to avoid overwhelming Scryfall API
  workers: 10, 
  timeout: 60000, // Increase timeout to 60s per test to allow for API calls and image loading
  expect: {
    timeout: 10000, // Expectations timeout
  },
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer: undefined, // Manual server start required for local HTTP server
  webServer: {
    command: 'npm run dev',
    // 👇 这里也改成 5175
    url: 'http://localhost:5175',
    reuseExistingServer: true,
  }
});
