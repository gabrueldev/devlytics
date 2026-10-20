import { env } from "cloudflare:test";
import { createDatabase, schema } from "@devlytics/db";
import { beforeEach, describe, expect, it } from "vitest";
import { D1UserRepository } from "../../src";

const db = createDatabase(env.DB);
const firstSeen = new Date("2026-10-20T00:00:00Z");
const profile = {
  githubId: "42",
  login: "fulano",
  email: "fulano@dev.com",
  name: "Fulano",
  avatarUrl: "https://avatars.githubusercontent.com/u/42",
};

describe("D1UserRepository", () => {
  beforeEach(async () => {
    await db.delete(schema.sites);
    await db.delete(schema.users);
  });

  it("creates the account on the first sign-in", async () => {
    const user = await new D1UserRepository(db).saveFromGithub(profile, {
      id: "user_1",
      createdAt: firstSeen,
    });

    expect(user).toEqual({ id: "user_1", createdAt: firstSeen, isSupporter: false, ...profile });
  });

  it("keeps the same account and refreshes the profile on later sign-ins", async () => {
    const users = new D1UserRepository(db);
    await users.saveFromGithub(profile, { id: "user_1", createdAt: firstSeen });

    const again = await users.saveFromGithub(
      { ...profile, name: "Fulano de Tal" },
      { id: "user_2", createdAt: new Date("2026-10-21T00:00:00Z") },
    );

    expect(again).toMatchObject({ id: "user_1", createdAt: firstSeen, name: "Fulano de Tal" });
    await expect(users.findById("user_2")).resolves.toBeNull();
  });
});
