import { describe, expect, it } from "vitest";
import { EdgeTokenCache } from "../../src";

const now = Date.now();

describe("EdgeTokenCache", () => {
  it("hands a token to the next instance until it expires", async () => {
    const cache = new EdgeTokenCache(await caches.open(crypto.randomUUID()), () => now);
    const token = { value: "token_1", expiresAt: now + 60_000 };

    await cache.write("client", token);

    await expect(cache.read("client")).resolves.toEqual(token);
  });

  it("drops a token that Cakto rejected", async () => {
    const cache = new EdgeTokenCache(await caches.open(crypto.randomUUID()), () => now);
    await cache.write("client", { value: "token_1", expiresAt: now + 60_000 });

    await cache.remove("client");

    await expect(cache.read("client")).resolves.toBeNull();
  });
});
