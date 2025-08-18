import { defineConfig } from "tsup";

const config = {
  entry: ["src/index.ts", "src/vite-plugin.ts"],
  target: "es2019",
  tsconfig: "./tsconfig.build.json",
  bundle: true,
  clean: false,
  dts: false,
  sourcemap: false,
  splitting: false,
};

export default defineConfig([
  { ...config, format: "cjs", dts: true },
  { ...config, format: "esm" },
  { ...config, entry: ["src/cx.ts"], format: "esm" },
]);
