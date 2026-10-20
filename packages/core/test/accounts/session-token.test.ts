import { describe, expect, it } from "vitest";
import { SessionTokens } from "../../src";

const now = new Date("2026-10-20T15:00:00Z");
const expiresAt = new Date("2026-11-19T15:00:00Z");

describe("SessionTokens", () => {
  it("reads back the user of a token it issued", async () => {
    const tokens = new SessionTokens("secret");
    const token = await tokens.issue({ userId: "user_1", expiresAt });

    await expect(tokens.verify(token, now)).resolves.toEqual({ userId: "user_1", expiresAt });
  });

  it("rejects a token signed with another secret", async () => {
    const token = await new SessionTokens("other").issue({ userId: "user_1", expiresAt });

    await expect(new SessionTokens("secret").verify(token, now)).resolves.toBeNull();
  });

  it("rejects a token whose user was swapped", async () => {
    const tokens = new SessionTokens("secret");
    const [, expiry, signature] = (await tokens.issue({ userId: "user_1", expiresAt })).split(".");

    await expect(tokens.verify(`user_2.${expiry}.${signature}`, now)).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const tokens = new SessionTokens("secret");
    const token = await tokens.issue({ userId: "user_1", expiresAt: now });

    await expect(tokens.verify(token, now)).resolves.toBeNull();
  });
});
