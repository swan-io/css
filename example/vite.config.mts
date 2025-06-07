import react from "@vitejs/plugin-react-swc";
import path from "path";
import url from "url";
import { defineConfig } from "vite";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const source = path.join(__dirname, "..", "src");

export default defineConfig({
  build: { sourcemap: true },
  plugins: [react()],
  resolve: {
    alias: { "@swan-io/css": source },
    dedupe: ["react", "react-dom"],
  },
});
