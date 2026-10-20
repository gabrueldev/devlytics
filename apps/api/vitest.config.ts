import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations("../../packages/db/migrations");

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            CF_ANALYTICS_TOKEN: "test-token",
            CAKTO_WEBHOOK_SECRET: "test-secret",
            CAKTO_CLIENT_ID: "test-client",
            CAKTO_CLIENT_SECRET: "test-client-secret",
            GITHUB_CLIENT_SECRET: "test-github-secret",
            SESSION_SECRET: "test-session-secret",
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/setup.ts"],
    },
  };
});
