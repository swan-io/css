import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root");

if (root != null) {
  createRoot(root).render(<App />);
}
