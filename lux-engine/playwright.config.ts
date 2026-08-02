import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  webServer:
    process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
      ? undefined
      : {
          command:
            "node ./node_modules/next/dist/bin/next dev --webpack --port 3000",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120000,
        },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
