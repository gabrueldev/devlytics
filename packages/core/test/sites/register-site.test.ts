import { describe, expect, it } from "vitest";
import { DomainTakenError, InvalidDomainError, registerSite, removeSite, SiteNotFoundError } from "../../src";
import { InMemorySiteCatalog } from "../fakes/in-memory-site-catalog";

const createdAt = new Date("2026-10-20T15:00:00Z");
const deps = (sites = new InMemorySiteCatalog()) => ({
  sites,
  newId: () => "site_new",
  now: () => createdAt,
});

describe("registerSite", () => {
  it("accepts whatever the developer pastes and keeps only the domain", async () => {
    const site = await registerSite(deps())("user_1", {
      name: " Fulano ",
      domain: "https://www.Fulano.dev/projetos",
    });

    expect(site).toEqual({
      id: "site_new",
      userId: "user_1",
      name: "Fulano",
      domain: "fulano.dev",
      createdAt,
    });
  });

  it("names the site after its domain when no name is given", async () => {
    const site = await registerSite(deps())("user_1", { name: "", domain: "fulano.dev" });

    expect(site.name).toBe("fulano.dev");
  });

  it("refuses text that is not a domain", async () => {
    await expect(
      registerSite(deps())("user_1", { name: "x", domain: "my portfolio" }),
    ).rejects.toBeInstanceOf(InvalidDomainError);
  });

  it("refuses a domain someone already registered", async () => {
    const sites = new InMemorySiteCatalog([
      { id: "s", userId: "user_2", name: "x", domain: "fulano.dev", createdAt },
    ]);

    await expect(
      registerSite(deps(sites))("user_1", { name: "x", domain: "fulano.dev" }),
    ).rejects.toBeInstanceOf(DomainTakenError);
  });
});

describe("removeSite", () => {
  it("does not let a developer remove someone else's site", async () => {
    const sites = new InMemorySiteCatalog([
      { id: "s", userId: "user_2", name: "x", domain: "fulano.dev", createdAt },
    ]);

    await expect(removeSite({ sites })("user_1", "s")).rejects.toBeInstanceOf(SiteNotFoundError);
    expect(sites.sites).toHaveLength(1);
  });
});
