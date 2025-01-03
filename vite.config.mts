import { defineConfig } from "vitest/config";

const BROWSER = process.env.BROWSER ?? "chromium";
const CI = process.env.CI === String(true);

export default defineConfig({
  test: {
    include: ["__tests__/**/*.{ts,tsx}"],
    exclude: ["__tests__/utils.ts"],
    setupFiles: ["./testSetup.ts"],
    browser: {
      enabled: true,
      headless: CI,
      name: BROWSER,
      provider: "playwright",
    },
  },
});
