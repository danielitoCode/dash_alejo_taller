import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  // Ensures the project root is stable even if the IDE runs Vite with a different CWD.
  root: rootDir,
  // Ensures `.env` is loaded from the project root even if the IDE runs Vite with a different CWD.
  envDir: rootDir,
  plugins: [svelte()],
})
