import { defineConfig } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 2,
  use: {
    baseURL,
    headless: true,
  },
  webServer:
    process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
      ? undefined
      : {
          command: `node ./node_modules/next/dist/bin/next dev --webpack --port ${port}`,
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120000,
        },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
