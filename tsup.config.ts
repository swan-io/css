import { defineConfig } from "tsup";

const config = {
  entry: ["src/index.ts", "src/vite-plugin.ts"],
  target: "es2019",
  tsconfig: "./tsconfig.build.json",
  bundle: true,
  clean: false,
  sourcemap: false,
  splitting: false,
};

export default defineConfig([
  { ...config, format: "cjs", dts: true },
  { ...config, format: "esm", dts: false },
]);
