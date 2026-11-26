import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
// Optional: use an already installed Chromium instead of Playwright's own download.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    launchOptions: { executablePath },
  },
  projects: [
    // @handy: only meaningful on a phone; @einmal: independent of the screen (build files, metadata).
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@handy/ },
    { name: "handy", use: { ...devices["Pixel 7"] }, grepInvert: /@einmal/ },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
