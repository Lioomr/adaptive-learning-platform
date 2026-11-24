import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "student.spec.ts",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    channel: "chromium",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  outputDir: "./test-results/student",
  webServer: {
    command: "npm run dev -- --hostname localhost",
    url: "http://localhost:3000/student",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
