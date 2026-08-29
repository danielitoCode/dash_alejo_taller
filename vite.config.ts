import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
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
                  // Live Appwrite tests must not inherit MSW (onUnhandledRequest: error).
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
              // Node + no MSW: real fetch to Appwrite (B3.1 transactions).
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
