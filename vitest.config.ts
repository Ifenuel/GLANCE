import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the parts of the platform that must never silently break:
 * form validation, date/number formatting and the rate limiter's fallback.
 * They run without a database, so CI needs no secrets.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      // The real package refuses to load outside a React Server Component.
      "server-only": path.resolve(process.cwd(), "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
