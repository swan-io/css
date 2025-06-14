import react from "@vitejs/plugin-react-swc";
import path from "path";
import url from "url";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";
import { plugin } from "./src/plugin";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const source = path.join(__dirname, "..", "src");

export default defineConfig(({ command }) => ({
  build: { sourcemap: true },
  plugins: [
    react(),
    command === "build" && inspect({ build: true }),
    command === "build" && plugin(),
  ],
  resolve: {
    alias: { "@swan-io/css": source },
    dedupe: ["react", "react-dom"],
  },
}));
