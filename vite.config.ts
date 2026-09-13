import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  envDir: rootDir,
  plugins: [svelte()],
  // Auth0 Application: Callback / Logout / Web Origins = http://localhost:5173/
  // Puerto fijo evita mismatch de redirect_uri.
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "localhost",
    port: 5173,
    strictPort: true,
  },
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
                  exclude: ["src/test/integration/appwrite/**"],
              }
          },
          {
              extends: true,
              test: {
                  name: "ui",
                  include: ["src/**/*.ui.test.ts"]
              }
          },
          {
              test: {
                  name: "appwrite",
                  environment: "node",
                  include: ["src/test/integration/appwrite/**/*.test.ts"],
                  setupFiles: [],
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
