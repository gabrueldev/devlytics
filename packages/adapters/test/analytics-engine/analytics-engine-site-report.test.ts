import { describe, expect, it } from "vitest";
import { AnalyticsEngineSiteReport, type SqlRow, type SqlRunner } from "../../src";

const period = { since: new Date("2026-10-13T00:00:00Z"), until: new Date("2026-10-20T00:00:00Z") };

const answers = (sql: string): SqlRow[] => {
  if (sql.includes("AS projectViews"))
    return [
      { session: "a", attention: 2_000, projectViews: 0 },
      { session: "b", attention: 40_000, projectViews: 3 },
    ];
  if (sql.includes("GROUP BY session, action")) return [{ session: "b", action: "email" }];
  if (sql.includes("GROUP BY day")) return [{ day: "2026-10-19 00:00:00", total: "3" }];
  if (sql.includes("GROUP BY name, action"))
    return [
      { name: "MagazineAPI", action: "repo", total: 2 },
      { name: "MagazineAPI", action: "demo", total: 1 },
    ];
  if (sql.includes("blob3 = 'project'")) return [{ name: "MagazineAPI", attention: 90_000.6, visitors: "3" }];
  if (sql.includes("GROUP BY name") && sql.includes("blob9")) return [{ name: "BR", value: 3 }];
  if (sql.includes("COUNT(DISTINCT blob12) AS total")) return [{ total: "5" }];
  return [];
};

describe("AnalyticsEngineSiteReport", () => {
  it("joins attention and clicks per project", async () => {
    const runner: SqlRunner = { query: async (sql) => answers(sql) };

    const report = await new AnalyticsEngineSiteReport(runner, "devlytics_events").report("site_1", period);

    expect(report.visits).toBe(5);
    expect(report.daily).toEqual([{ day: "2026-10-19", visits: 3 }]);
    expect(report.projects).toEqual([
      { name: "MagazineAPI", visitors: 3, attentionMs: 90_001, repoClicks: 2, demoClicks: 1 },
    ]);
    expect(report.countries).toEqual([{ name: "BR", value: 3 }]);
  });

  it("rebuilds each visit's journey from its attention and clicks", async () => {
    const runner: SqlRunner = { query: async (sql) => answers(sql) };

    const report = await new AnalyticsEngineSiteReport(runner, "devlytics_events").report("site_1", period);

    expect(report.journeys).toEqual([
      { attentionMs: 2_000, viewedProjects: false, actions: [] },
      { attentionMs: 40_000, viewedProjects: true, actions: ["email"] },
    ]);
  });

  it("refuses identifiers that could break out of the query", async () => {
    const runner: SqlRunner = { query: async () => [] };

    await expect(
      new AnalyticsEngineSiteReport(runner, "devlytics_events").report("x' OR 1=1", period),
    ).rejects.toThrow();
  });
});
