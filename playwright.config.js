// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const repoRoot = __dirname;

// Try to load backend/.env if dotenv available, otherwise skip
try {
  require('dotenv').config({
    path: path.join(repoRoot, 'backend', '.env'),
    override: false,
  });
} catch (e) {
  // dotenv not required for unit tests
}

// CRITICAL: Set test environment variables BEFORE backend starts
// These MUST match what tests expect
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.MONGO_URI = process.env.MONGO_URI ||'TEST_ONLY_NOT_FOR_PRODUCTION';
process.env.JWT_SECRET = process.env.JWT_SECRET ||'actual-secret-here';
process.env.TEST_DB_URI = process.env.TEST_DB_URI ||'TEST_ONLY_NOT_FOR_PRODUCTION';

const backendEnv = {
  ...process.env,
  PORT: '5000',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: 'test',
};

// Same-origin `/api` so Vite proxies to the backend and `page.route('**/api/**')` can intercept.
const frontendEnv = {
  ...process.env,
  VITE_API_URL: '/api',
};

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  projects: [
    {
      name: 'component-tests',
      testMatch: ['**/unit/**/*.spec.js', '**/integration/**/*.spec.js', '**/system/**/*.spec.js'],
      use: {
        baseURL: 'http://127.0.0.1:5000',
      },
    },
    {
      name: 'api',
      testMatch: ['**/e2e/**/reading.api.spec.js', '**/e2e/**/reading-analytics.unit.spec.js'],
      use: {
        baseURL: 'http://127.0.0.1:5000',
      },
    },
    {
      name: 'chromium',
      testMatch: '**/e2e/**/*.ui.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:5173',
      },
    },
  ],
  webServer: [
    {
      command: 'npm start',
      cwd: path.join(repoRoot, 'backend'),
      url: 'http://127.0.0.1:5000/',
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      env: backendEnv,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      cwd: path.join(repoRoot, 'frontend'),
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: frontendEnv,
    },
  ],
});
