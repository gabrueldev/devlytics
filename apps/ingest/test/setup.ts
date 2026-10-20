import { applyD1Migrations, env } from "cloudflare:test";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
await env.DB.batch([
  env.DB.prepare("INSERT OR IGNORE INTO users (id, github_id, email, created_at) VALUES (?, ?, ?, ?)").bind(
    "user_1",
    "42",
    "fulano@dev.com",
    Date.now(),
  ),
  env.DB.prepare(
    "INSERT OR IGNORE INTO sites (id, user_id, name, domain, created_at) VALUES (?, ?, ?, ?, ?)",
  ).bind("site_1", "user_1", "Fulano", "fulano.dev", Date.now()),
]);
