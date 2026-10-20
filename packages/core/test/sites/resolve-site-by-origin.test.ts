import { describe, expect, it } from "vitest";
import { InvalidOriginError, resolveSiteByOrigin, UnknownSiteError, type Site } from "../../src";
import { InMemorySiteRepository } from "../fakes/in-memory-site-repository";

const portfolio: Site = {
  id: "site_1",
  userId: "user_1",
  name: "Fulano",
  domain: "fulano.dev",
  createdAt: new Date("2026-10-20T00:00:00Z"),
};

const resolve = resolveSiteByOrigin({ sites: new InMemorySiteRepository([portfolio]) });

describe("resolveSiteByOrigin", () => {
  it("finds the registered site behind the request origin", async () => {
    await expect(resolve("https://www.fulano.dev")).resolves.toEqual(portfolio);
  });

  it("refuses requests without an origin", async () => {
    await expect(resolve(null)).rejects.toBeInstanceOf(InvalidOriginError);
  });

  it("refuses origins that are not websites", async () => {
    await expect(resolve("file:///index.html")).rejects.toBeInstanceOf(InvalidOriginError);
  });

  it("refuses domains nobody registered", async () => {
    await expect(resolve("https://stranger.dev")).rejects.toBeInstanceOf(UnknownSiteError);
  });
});
