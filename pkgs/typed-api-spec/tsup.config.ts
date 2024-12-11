import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src", "!src/**/*.test.ts", "!src/**/*.t-test.ts"],
  target: "es2020",
  format: ["cjs", "esm"],
  clean: true,
  dts: true,
});
