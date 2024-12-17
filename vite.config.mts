import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.{ts,tsx}"],
    browser: {
      enabled: true,
      headless: process.env.CI === String(true),
      name: "chromium",
      provider: "playwright",
    },
  },
});
