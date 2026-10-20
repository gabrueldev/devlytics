import { describe, expect, it } from "vitest";
import { getDemoOverview, UnknownSiteError, type Site } from "../../src";
import { FixedStatsReader } from "../fakes/fixed-stats-reader";
import { InMemorySiteRepository } from "../fakes/in-memory-site-repository";

const demoSite: Site = {
  id: "site_demo",
  userId: "user_1",
  name: "Gabriel",
  domain: "gabrueldev.com",
  createdAt: new Date("2026-10-20T00:00:00Z"),
};

const now = new Date("2026-10-27T12:00:00Z");

const setUp = (sites: Site[]) => {
  const stats = new FixedStatsReader({
    visits: 40,
    sectionAttentionMs: 3_000_000,
    repoClicks: 12,
    topProject: "MagazineAPI",
  });
  const overview = getDemoOverview({
    sites: new InMemorySiteRepository(sites),
    stats,
    demoDomain: "gabrueldev.com",
    now: () => now,
  });
  return { stats, overview };
};

describe("getDemoOverview", () => {
  it("summarizes the demo portfolio over the last seven days", async () => {
    const { stats, overview } = setUp([demoSite]);

    await expect(overview()).resolves.toEqual({
      visits: 40,
      averageAttentionMs: 75_000,
      repoClicks: 12,
      topProject: "MagazineAPI",
    });
    expect(stats.requests).toEqual([
      { siteId: "site_demo", period: { since: new Date("2026-10-20T12:00:00Z"), until: now } },
    ]);
  });

  it("refuses to run before the demo portfolio is registered", async () => {
    const { overview } = setUp([]);

    await expect(overview()).rejects.toBeInstanceOf(UnknownSiteError);
  });
});
