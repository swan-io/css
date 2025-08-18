import swanCss from "@swan-io/css/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig(({ command }) => ({
  build: { sourcemap: true },
  plugins: [
    react(),
    command === "build" && inspect({ build: true }),
    command === "build" && swanCss(),
  ],
}));
