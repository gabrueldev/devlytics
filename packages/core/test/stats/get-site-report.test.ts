import { describe, expect, it } from "vitest";
import { getSiteReport, SiteNotFoundError, type SiteReportData, type StatsPeriod } from "../../src";
import { InMemorySiteCatalog } from "../fakes/in-memory-site-catalog";

const now = new Date("2026-10-20T15:00:00Z");
const site = { id: "site_1", userId: "user_1", name: "Fulano", domain: "fulano.dev", createdAt: now };
const data: SiteReportData = {
  visits: 4,
  sectionAttentionMs: 100_000,
  daily: [],
  projects: [],
  sections: [],
  conversions: [],
  sources: [],
  countries: [],
};

describe("getSiteReport", () => {
  it("reads the chosen period and works out the attention per visit", async () => {
    const periods: StatsPeriod[] = [];
    const report = await getSiteReport({
      sites: new InMemorySiteCatalog([site]),
      reports: { report: async (_id, period) => (periods.push(period), data) },
      now: () => now,
    })("user_1", "site_1", 7);

    expect(periods).toEqual([{ since: new Date("2026-10-13T15:00:00Z"), until: now }]);
    expect(report.averageAttentionMs).toBe(25_000);
    expect(report.site).toEqual({ id: "site_1", name: "Fulano", domain: "fulano.dev" });
  });

  it("hides other developers' sites", async () => {
    const run = getSiteReport({
      sites: new InMemorySiteCatalog([site]),
      reports: { report: async () => data },
      now: () => now,
    });

    await expect(run("user_2", "site_1", 7)).rejects.toBeInstanceOf(SiteNotFoundError);
  });
});
