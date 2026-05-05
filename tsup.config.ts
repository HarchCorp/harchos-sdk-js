import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: "node18",
  outDir: "dist",
  outExtension(ctx) {
    return {
      js: ctx.format === "cjs" ? ".cjs" : ".mjs",
    };
  },
});
