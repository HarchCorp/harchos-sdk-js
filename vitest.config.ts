import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/react/**", "src/types/**", "src/index.ts"],
    },
  },
  css: {
    modules: false,
  },
  server: {
    // Prevent picking up PostCSS config from parent directories
    watch: {
      ignored: ["**/postcss.config.*"],
    },
  },
});
