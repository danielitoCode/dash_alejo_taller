import { defineConfig } from "vitest/config";
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
  test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup/vitest.setup.ts"],
      exclude: ["node_modules", "dist", ".svelte-kit", "services", "workers"],
      projects: [
          {
              extends: true,
              test: {
                  name: "unit",
                  include: ["src/**/*.unit.test.ts"],
              }
          },
          {
              extends: true,
              test: {
                  name: "integration",
                  include: ["src/**/*.integration.test.ts"],
              }
          },
          {
              extends: true,
              test: {
                  name: "ui",
                  include: ["src/**/*.ui.test.ts"]
              }
          }
      ]
  },
  resolve: process.env.VITEST
      ? {
        conditions: ['browser']
      }
      : undefined
})
